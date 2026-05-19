import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyOwner, siteUrl } from "@/lib/notify";
import { markProposalPaid } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 400 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const proposalId = session.metadata?.proposal_id;

    if (proposalId && session.payment_status === "paid") {
      const admin = createSupabaseAdminClient();
      const result = await markProposalPaid(admin, proposalId, session);
      if (result.newlyPaid && result.ownerId) {
        await notifyOwner(result.ownerId, {
          subject: `Payment received for "${result.title}"`,
          heading: "You got paid 🎉",
          body: `Your client signed and paid for "${result.title}". Time to get to work!`,
          ctaLabel: "Open proposal",
          ctaUrl: `${siteUrl()}/proposals/${proposalId}`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
