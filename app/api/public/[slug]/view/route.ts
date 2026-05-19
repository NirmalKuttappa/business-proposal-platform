import { NextResponse } from "next/server";
import { notifyOwner, siteUrl } from "@/lib/notify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, owner_id, title, status")
    .eq("public_slug", slug)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // First view only: sent -> viewed.
  if (proposal.status === "sent") {
    await admin
      .from("proposals")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", proposal.id);

    await notifyOwner(proposal.owner_id, {
      subject: `Your proposal "${proposal.title}" was opened`,
      heading: "Your proposal was opened",
      body: `Good news — your client just opened "${proposal.title}".`,
      ctaLabel: "Open proposal",
      ctaUrl: `${siteUrl()}/proposals/${proposal.id}`,
    });
  }

  return NextResponse.json({ ok: true });
}
