import { notFound } from "next/navigation";
import { BookCallCard } from "@/components/book-call";
import { ProposalDocument } from "@/components/proposal-document";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Proposal, SignatureRecord } from "@/lib/types";
import { ProposalClient } from "./proposal-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("proposals")
    .select("title")
    .eq("public_slug", slug)
    .single();
  return { title: data?.title ?? "Proposal" };
}

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const { session_id } = await searchParams;
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from("proposals")
    .select("*")
    .eq("public_slug", slug)
    .single();

  if (!data) notFound();
  const proposal = data as Proposal;

  if (proposal.status === "draft") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-mist px-6 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          This proposal isn&apos;t available yet
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          The sender hasn&apos;t published it. Please check back soon.
        </p>
      </div>
    );
  }

  const { data: sigRows } = await admin
    .from("signatures")
    .select("*")
    .eq("proposal_id", proposal.id)
    .order("signed_at", { ascending: false })
    .limit(1);
  const sig = (sigRows?.[0] ?? null) as SignatureRecord | null;

  return (
    <div className="min-h-dvh bg-white">
      <ProposalDocument proposal={proposal} />
      <BookCallCard />
      <ProposalClient
        slug={slug}
        status={proposal.status}
        amount={proposal.amount_total}
        currency={proposal.currency}
        clientName={proposal.client_name}
        initialSignature={
          sig
            ? {
                signer_name: sig.signer_name,
                signature_type: sig.signature_type,
                signature_data: sig.signature_data,
                signed_at: sig.signed_at,
              }
            : null
        }
        returnedSessionId={session_id ?? null}
      />
    </div>
  );
}
