import { NextResponse } from "next/server";
import { notifyOwner, siteUrl } from "@/lib/notify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const signerName = String(body.signerName ?? "").trim();
  const signatureType = body.signatureType === "drawn" ? "drawn" : "typed";
  const signatureData = String(body.signatureData ?? "").trim();

  if (!signerName) {
    return NextResponse.json(
      { error: "Your name is required." },
      { status: 400 },
    );
  }
  if (!signatureData) {
    return NextResponse.json(
      { error: "A signature is required." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, owner_id, title, status")
    .eq("public_slug", slug)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (proposal.status === "draft") {
    return NextResponse.json(
      { error: "This proposal is not available for signing." },
      { status: 403 },
    );
  }
  if (proposal.status === "signed" || proposal.status === "paid") {
    return NextResponse.json({ ok: true, alreadySigned: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  const { error: sigError } = await admin.from("signatures").insert({
    proposal_id: proposal.id,
    signer_name: signerName,
    signature_type: signatureType,
    signature_data: signatureData,
    ip_address: ip,
    user_agent: userAgent,
  });
  if (sigError) {
    console.error("[sign] insert error:", sigError);
    return NextResponse.json(
      { error: "Could not record your signature." },
      { status: 500 },
    );
  }

  await admin
    .from("proposals")
    .update({ status: "signed", signed_at: new Date().toISOString() })
    .eq("id", proposal.id);

  await notifyOwner(proposal.owner_id, {
    subject: `"${proposal.title}" was signed`,
    heading: "Your proposal was signed 🎉",
    body: `${signerName} just signed "${proposal.title}". They can now complete payment.`,
    ctaLabel: "Open proposal",
    ctaUrl: `${siteUrl()}/proposals/${proposal.id}`,
  });

  return NextResponse.json({ ok: true });
}
