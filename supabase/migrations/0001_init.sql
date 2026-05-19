-- ════════════════════════════════════════════════════════════════
-- Proposal platform — initial schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════

-- ── profiles ────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  company_name text,
  created_at   timestamptz not null default now()
);

-- ── proposals ───────────────────────────────────────────────────
create table public.proposals (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  public_slug    text not null unique,
  title          text not null default 'Untitled proposal',
  client_name    text not null default '',
  client_email   text,
  client_company text,
  status         text not null default 'draft'
                 check (status in ('draft','sent','viewed','signed','paid')),
  content        jsonb not null default '{}'::jsonb,
  amount_total   integer not null default 0,   -- cents
  currency       text not null default 'USD',
  ai_brief       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  sent_at        timestamptz,
  viewed_at      timestamptz,
  signed_at      timestamptz,
  paid_at        timestamptz
);
create index proposals_owner_idx on public.proposals(owner_id);
create index proposals_slug_idx  on public.proposals(public_slug);

-- ── signatures ──────────────────────────────────────────────────
create table public.signatures (
  id             uuid primary key default gen_random_uuid(),
  proposal_id    uuid not null references public.proposals(id) on delete cascade,
  signer_name    text not null,
  signature_type text not null check (signature_type in ('typed','drawn')),
  signature_data text not null,                -- typed name or drawn data-URL
  ip_address     text,
  user_agent     text,
  signed_at      timestamptz not null default now()
);
create index signatures_proposal_idx on public.signatures(proposal_id);

-- ── payments ────────────────────────────────────────────────────
create table public.payments (
  id                         uuid primary key default gen_random_uuid(),
  proposal_id                uuid not null references public.proposals(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text,
  amount                     integer not null default 0,  -- cents
  currency                   text not null default 'USD',
  status                     text not null default 'pending',
  paid_at                    timestamptz,
  created_at                 timestamptz not null default now()
);
create index payments_proposal_idx on public.payments(proposal_id);

-- ── keep proposals.updated_at fresh ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger proposals_touch_updated
  before update on public.proposals
  for each row execute function public.touch_updated_at();

-- ── auto-create a profile row when a user signs up ──────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- Row Level Security
-- Each owner sees only their own data. Public proposal pages and
-- webhooks use the service-role key, which bypasses RLS entirely.
-- ════════════════════════════════════════════════════════════════
alter table public.profiles   enable row level security;
alter table public.proposals  enable row level security;
alter table public.signatures enable row level security;
alter table public.payments   enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- proposals
create policy "proposals_select_own" on public.proposals
  for select using (auth.uid() = owner_id);
create policy "proposals_insert_own" on public.proposals
  for insert with check (auth.uid() = owner_id);
create policy "proposals_update_own" on public.proposals
  for update using (auth.uid() = owner_id);
create policy "proposals_delete_own" on public.proposals
  for delete using (auth.uid() = owner_id);

-- signatures — owner may read signatures on their own proposals
create policy "signatures_select_own" on public.signatures
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = signatures.proposal_id and p.owner_id = auth.uid()
    )
  );

-- payments — owner may read payments on their own proposals
create policy "payments_select_own" on public.payments
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = payments.proposal_id and p.owner_id = auth.uid()
    )
  );
