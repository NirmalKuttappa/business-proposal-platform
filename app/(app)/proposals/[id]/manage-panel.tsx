"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProposalStatus } from "@/lib/types";

export function ManagePanel({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: ProposalStatus;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${slug}`);
  }, [slug]);

  async function send() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("proposals")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
    router.refresh();
    setBusy(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function remove() {
    if (
      !confirm("Delete this proposal permanently? This cannot be undone.")
    )
      return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("proposals").delete().eq("id", id);
    router.push("/dashboard");
    router.refresh();
  }

  if (status === "draft") {
    return (
      <div className="rounded-2xl border border-hairline/80 bg-white p-5">
        <h2 className="text-[16px] font-semibold text-ink">
          Ready to send?
        </h2>
        <p className="mt-1 text-[14px] text-ink-soft">
          Sending publishes the proposal at a shareable link. You can still
          edit it afterwards.
        </p>
        <Button onClick={send} disabled={busy} className="mt-4">
          {busy ? <Spinner /> : null}
          Send to client
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline/80 bg-white p-5">
      <h2 className="text-[16px] font-semibold text-ink">
        Share with your client
      </h2>
      <p className="mt-1 text-[14px] text-ink-soft">
        Send this link to your client — no account needed to view, sign, or pay.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 truncate rounded-xl border border-hairline bg-mist px-3 py-2 text-[13px] text-ink-soft"
        />
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[13px]">
        <a
          href={url || "#"}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent hover:underline"
        >
          Open client view ↗
        </a>
        <button
          onClick={remove}
          disabled={busy}
          className="text-ink-faint transition-colors hover:text-[#c0392b] disabled:opacity-50"
        >
          Delete proposal
        </button>
      </div>
    </div>
  );
}
