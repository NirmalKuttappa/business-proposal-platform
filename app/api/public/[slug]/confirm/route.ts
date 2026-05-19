import { NextResponse } from "next/server";
import { notifyOwner, siteUrl } from "@/lib/notify";
import { markProposalPaid } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Called when the client returns from Stripe Checkout. Confirms the
 * payment directly with Stripe and marks the proposal paid. This makes
 * payment reliable even if the Stripe webhook is not configured.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const sessionId = String(body.sessionId ?? "");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, status")
    .eq("public_slug", slug)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (proposal.status === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ status: proposal.status });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.payment_status === "paid" &&
      session.metadata?.proposal_id === proposal.id
    ) {
      const result = await markProposalPaid(admin, proposal.id, session);
      if (result.newlyPaid && result.ownerId) {
        await notifyOwner(result.ownerId, {
          subject: `Payment received for "${result.title}"`,
          heading: "You got paid 🎉",
          body: `Your client signed and paid for "${result.title}". Time to get to work!`,
          ctaLabel: "Open proposal",
          ctaUrl: `${siteUrl()}/proposals/${proposal.id}`,
        });
      }
      return NextResponse.json({ status: "paid" });
    }
  } catch (err) {
    console.error("[confirm] Stripe error:", err);
  }

  return NextResponse.json({ status: proposal.status });
}
