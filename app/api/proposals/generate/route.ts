import { NextResponse } from "next/server";
import { dollarsToCents } from "@/lib/format";
import { generateSlug } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assembleProposalContent, generateProposalDraft } from "@/lib/template";

// AI generation can take up to ~1 minute.
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const brief = String(body.brief ?? "").trim();
  const clientName = String(body.clientName ?? "").trim();
  const clientCompany = String(body.clientCompany ?? "").trim();
  const clientEmail = String(body.clientEmail ?? "").trim();
  const currency = (String(body.currency ?? "USD").trim() || "USD").toUpperCase();
  const amountTotalCents = dollarsToCents(
    typeof body.amount === "number" || typeof body.amount === "string"
      ? body.amount
      : 0,
  );

  if (brief.length < 10) {
    return NextResponse.json(
      { error: "Please describe the project in a little more detail." },
      { status: 400 },
    );
  }
  if (!clientName) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 },
    );
  }
  if (amountTotalCents <= 0) {
    return NextResponse.json(
      { error: "Enter the proposal total." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .single();

  const ownerName = profile?.full_name ?? "";
  const ownerCompany = profile?.company_name ?? "";

  let draft;
  try {
    draft = await generateProposalDraft({
      brief,
      clientName,
      clientCompany,
      ownerName,
      ownerCompany,
    });
  } catch (err) {
    console.error("[generate] AI error:", err);
    return NextResponse.json(
      {
        error:
          "Proposal generation failed. Check that ANTHROPIC_API_KEY is set correctly, then try again.",
      },
      { status: 502 },
    );
  }

  const content = assembleProposalContent(draft, {
    clientName,
    clientCompany,
    ownerName,
    ownerCompany,
    amountTotalCents,
  });

  const { data: inserted, error } = await supabase
    .from("proposals")
    .insert({
      owner_id: user.id,
      public_slug: generateSlug(),
      title: content.cover.title,
      client_name: clientName,
      client_email: clientEmail || null,
      client_company: clientCompany || null,
      status: "draft",
      content,
      amount_total: amountTotalCents,
      currency,
      ai_brief: brief,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[generate] insert error:", error);
    return NextResponse.json(
      { error: "Could not save the proposal." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: inserted.id });
}
