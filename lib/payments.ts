import type Stripe from "stripe";
import type { createSupabaseAdminClient } from "./supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/**
 * Records a completed Stripe payment and marks the proposal paid.
 * Idempotent — safe to call from both the webhook and the return-page
 * confirmation. Returns whether this call was the one that flipped the
 * proposal to "paid" (so the owner is emailed only once).
 */
export async function markProposalPaid(
  admin: AdminClient,
  proposalId: string,
  session: Stripe.Checkout.Session,
): Promise<{ newlyPaid: boolean; ownerId: string | null; title: string }> {
  const { data: proposal } = await admin
    .from("proposals")
    .select("owner_id, title, status")
    .eq("id", proposalId)
    .single();

  const newlyPaid = !!proposal && proposal.status !== "paid";

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await admin.from("payments").upsert(
    {
      proposal_id: proposalId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount: session.amount_total ?? 0,
      currency: (session.currency ?? "usd").toUpperCase(),
      status: "paid",
      paid_at: new Date().toISOString(),
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (newlyPaid) {
    await admin
      .from("proposals")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", proposalId);
  }

  return {
    newlyPaid,
    ownerId: proposal?.owner_id ?? null,
    title: proposal?.title ?? "your proposal",
  };
}
