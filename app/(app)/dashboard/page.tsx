import Link from "next/link";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  const proposals = (data ?? []) as Proposal[];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Your proposals
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {proposals.length === 0
              ? "Create your first proposal to get started."
              : `${proposals.length} proposal${proposals.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <ButtonLink href="/proposals/new">New proposal</ButtonLink>
      </div>

      {proposals.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-hairline px-8 py-20 text-center">
          <p className="text-[17px] font-medium text-ink">No proposals yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
            Describe a project in a sentence or two and let AI draft a
            polished, client-ready proposal for you.
          </p>
          <ButtonLink href="/proposals/new" className="mt-6">
            Create a proposal
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-2xl border border-hairline/80">
          {proposals.map((p, i) => (
            <Link
              key={p.id}
              href={`/proposals/${p.id}`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-mist ${
                i > 0 ? "border-t border-hairline/70" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">
                  {p.title || "Untitled proposal"}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-ink-faint">
                  {p.client_name || "No client yet"}
                  {p.client_company ? ` · ${p.client_company}` : ""} ·{" "}
                  {formatDate(p.updated_at)}
                </p>
              </div>
              <span className="hidden text-[14px] tabular-nums text-ink-soft sm:block">
                {formatMoney(p.amount_total, p.currency)}
              </span>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
