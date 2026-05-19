import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, title, status, amount_total, currency, client_email")
    .eq("public_slug", slug)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (proposal.status === "paid") {
    return NextResponse.json(
      { error: "This proposal has already been paid." },
      { status: 400 },
    );
  }
  if (proposal.status !== "signed") {
    return NextResponse.json(
      { error: "Please sign the proposal before paying." },
      { status: 400 },
    );
  }
  if (!proposal.amount_total || proposal.amount_total <= 0) {
    return NextResponse.json(
      { error: "This proposal has no amount to charge." },
      { status: 400 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 500 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (proposal.currency || "USD").toLowerCase(),
            product_data: { name: proposal.title },
            unit_amount: proposal.amount_total,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/p/${slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/p/${slug}`,
      metadata: { proposal_id: proposal.id, slug },
      ...(proposal.client_email
        ? { customer_email: proposal.client_email }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
