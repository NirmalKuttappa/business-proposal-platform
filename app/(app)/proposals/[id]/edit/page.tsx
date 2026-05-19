import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Proposal } from "@/lib/types";
import { ProposalEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return <ProposalEditor proposal={data as Proposal} />;
}
