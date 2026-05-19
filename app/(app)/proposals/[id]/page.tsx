import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  type PaymentRecord,
  type Proposal,
  type SignatureRecord,
} from "@/lib/types";
import { ManagePanel } from "./manage-panel";

export const dynamic = "force-dynamic";

export default async function ProposalOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();
  if (!proposalRow) notFound();
  const proposal = proposalRow as Proposal;

  const { data: sigRows } = await supabase
    .from("signatures")
    .select("*")
    .eq("proposal_id", id)
    .order("signed_at", { ascending: false });
  const signature = (sigRows?.[0] ?? null) as SignatureRecord | null;

  const { data: payRows } = await supabase
    .from("payments")
    .select("*")
    .eq("proposal_id", id)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  const payment = (payRows?.[0] ?? null) as PaymentRecord | null;

  const currentIndex = STATUS_ORDER.indexOf(proposal.status);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-[14px] text-ink-soft transition-colors hover:text-ink"
      >
        ← Back to proposals
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            {proposal.title}
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {proposal.client_name}
            {proposal.client_company ? ` · ${proposal.client_company}` : ""} ·{" "}
            {formatMoney(proposal.amount_total, proposal.currency)}
          </p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      {/* Status stepper */}
      <div className="mt-6 flex gap-1.5">
        {STATUS_ORDER.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full ${
                i <= currentIndex ? "bg-accent" : "bg-hairline"
              }`}
            />
            <span
              className={`mt-1.5 block text-[11px] ${
                i <= currentIndex ? "text-ink" : "text-ink-faint"
              }`}
            >
              {STATUS_LABEL[s]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-4">
        <ManagePanel
          id={proposal.id}
          slug={proposal.public_slug}
          status={proposal.status}
        />

        {/* Signature record */}
        {signature ? (
          <div className="rounded-2xl border border-hairline/80 bg-white p-5">
            <h2 className="text-[16px] font-semibold text-ink">Signed</h2>
            <p className="mt-1 text-[14px] text-ink-soft">
              {signature.signer_name} · {formatDate(signature.signed_at)}
            </p>
            <div className="mt-3 rounded-xl border border-hairline/70 bg-mist p-4">
              {signature.signature_type === "drawn" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={signature.signature_data}
                  alt="Client signature"
                  className="max-h-24"
                />
              ) : (
                <p className="text-[26px] italic text-ink [font-family:cursive]">
                  {signature.signature_data}
                </p>
              )}
            </div>
            {signature.ip_address ? (
              <p className="mt-2 text-[12px] text-ink-faint">
                Audit: signed from {signature.ip_address}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Payment record */}
        {payment ? (
          <div className="rounded-2xl border border-hairline/80 bg-white p-5">
            <h2 className="text-[16px] font-semibold text-ink">Paid</h2>
            <p className="mt-1 text-[14px] text-ink-soft">
              {formatMoney(payment.amount, payment.currency)} received ·{" "}
              {formatDate(payment.paid_at)}
            </p>
          </div>
        ) : null}

        {/* Edit / preview */}
        <div className="flex gap-2.5">
          <ButtonLink
            href={`/proposals/${proposal.id}/edit`}
            variant="secondary"
          >
            Edit proposal
          </ButtonLink>
          <ButtonLink
            href={`/p/${proposal.public_slug}`}
            variant="ghost"
            target="_blank"
          >
            Preview ↗
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
