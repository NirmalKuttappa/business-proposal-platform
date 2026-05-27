**Deployed on Netlify: businessprop-test-a06c.netlify.app**

# Proposals

Generate polished client proposals with AI, share them as a web page, and
collect a signature and payment — all in one flow.

- **Sign in** with email + password (Supabase Auth)
- **Dashboard** of all your proposals with live status
- **New proposal** → describe the project in a sentence or two → Claude
  **Opus 4.7** drafts a complete 12-section proposal
- **Edit** any section, then **Send** to get a shareable public link
- The **client** opens the link (no login), **signs** (typed or drawn), and
  **pays** the full amount via Stripe
- A celebratory animation plays once signed + paid
- You get **email + dashboard** updates at every step

## Tech stack

Next.js (App Router) · Supabase (Postgres + Auth) · Anthropic Claude ·
Stripe Checkout · Resend · Tailwind CSS · deployed on Netlify.

---

## 1. Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- Accounts (all have free tiers): Supabase, Anthropic, Stripe, Resend, Netlify

## 2. Install

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` as you complete the steps below.

## 3. Supabase (database + auth)

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query** → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   This creates the tables, triggers, and Row Level Security policies.
3. **Project Settings → API** → copy into `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
4. **Authentication → Providers → Email**: for fast local testing, turn
   **off** "Confirm email" so new sign-ups can log in immediately. (Leave it
   on in production.)

## 4. Anthropic (AI generation)

1. Create an API key at <https://console.anthropic.com> → **API Keys**.
2. Set `ANTHROPIC_API_KEY` in `.env.local`.

## 5. Stripe (payments)

1. At <https://dashboard.stripe.com>, stay in **Test mode**.
2. **Developers → API keys** → copy into `.env.local`:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Webhook secret — see step 8 (local) or step 9 (production).
   Payment still completes without it (the return page confirms directly with
   Stripe), but the webhook is the reliable backstop.

## 6. Resend (email notifications — optional)

1. Create an API key at <https://resend.com> → **API Keys** → set `RESEND_API_KEY`.
2. `RESEND_FROM_EMAIL` defaults to `onboarding@resend.dev` (works for testing).
   Use an address on a verified domain for production.
   If you skip Resend entirely, the app still works — emails are just no-ops.

## 7. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, create an account, and generate a proposal.

## 8. Test the Stripe webhook locally (optional)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_…` secret it prints into `STRIPE_WEBHOOK_SECRET`.

## 9. Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify, **Add new site → Import from Git** and select the repo.
   The build settings come from [`netlify.toml`](netlify.toml).
3. **Site configuration → Environment variables**: add every variable from
   `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your Netlify URL
   (e.g. `https://your-site.netlify.app`).
4. Deploy.
5. In Stripe, **Developers → Webhooks → Add endpoint**:
   - URL: `https://your-site.netlify.app/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret into the `STRIPE_WEBHOOK_SECRET` env var and redeploy.

> **Note:** AI generation can take ~30–60s. If Netlify times out the
> `/api/proposals/generate` function, raise the function timeout in
> **Site configuration → Functions**.

## 10. Try the full flow

1. Sign in → **New proposal** → fill the form → **Generate proposal**.
2. Review/edit the draft → **Save & done**.
3. On the proposal page, **Send to client**, then **Copy** the link.
4. Open the link in an incognito window → **Review & sign** (try both typed
   and drawn) → **Pay**.
5. Use Stripe test card **`4242 4242 4242 4242`**, any future expiry, any CVC.
6. After payment you'll see the success animation; the dashboard shows
   **Paid**.

## Project structure

```
app/
  (app)/           Authenticated app — dashboard, proposal new/edit/overview
  p/[slug]/        Public proposal page — sign + pay (no auth)
  api/             AI generation, public actions, Stripe webhook
components/        UI, proposal renderer, signature pad, success animation
lib/               Supabase clients, Anthropic, Stripe, template, helpers
supabase/migrations/0001_init.sql   Database schema + RLS
docs/proposal template.pdf          The source template this default is based on
```
