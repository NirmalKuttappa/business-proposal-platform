"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DrawCanvas, type DrawCanvasHandle } from "@/components/draw-canvas";
import { SuccessCelebration } from "@/components/success-celebration";
import { Spinner, cn } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import type { ProposalStatus } from "@/lib/types";

type LocalSignature = {
  signer_name: string;
  signature_type: "typed" | "drawn";
  signature_data: string;
  signed_at: string;
};

export function ProposalClient({
  slug,
  status: initialStatus,
  amount,
  currency,
  clientName,
  initialSignature,
  returnedSessionId,
}: {
  slug: string;
  status: ProposalStatus;
  amount: number;
  currency: string;
  clientName: string;
  initialSignature: LocalSignature | null;
  returnedSessionId: string | null;
}) {
  const [status, setStatus] = useState<ProposalStatus>(initialStatus);
  const [signature, setSignature] = useState<LocalSignature | null>(
    initialSignature,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typedName, setTypedName] = useState(clientName);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const drawRef = useRef<DrawCanvasHandle>(null);

  const signed = status === "signed" || status === "paid";
  const paid = status === "paid";
  const priceLabel = formatMoney(amount, currency);

  // Record the page view once.
  useEffect(() => {
    fetch(`/api/public/${slug}/view`, { method: "POST" }).catch(() => {});
  }, [slug]);

  // Finalize payment when the client returns from Stripe Checkout.
  useEffect(() => {
    if (!returnedSessionId) return;
    setConfirming(true);
    fetch(`/api/public/${slug}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: returnedSessionId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "paid") {
          setStatus("paid");
          setCelebrate(true);
        }
      })
      .catch(() => {})
      .finally(() => setConfirming(false));
  }, [returnedSessionId, slug]);

  async function submitSignature() {
    setError(null);
    const name = typedName.trim();
    if (!name) {
      setError("Please enter your full name.");
      return;
    }
    if (!consent) {
      setError("Please confirm you agree to the terms of this proposal.");
      return;
    }

    let data = name;
    if (mode === "drawn") {
      const url = drawRef.current?.getDataURL();
      if (!url) {
        setError("Please draw your signature in the box.");
        return;
      }
      data = url;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/public/${slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: name,
          signatureType: mode,
          signatureData: data,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Could not record your signature.");
        setBusy(false);
        return;
      }
      setSignature({
        signer_name: name,
        signature_type: mode,
        signature_data: data,
        signed_at: new Date().toISOString(),
      });
      setStatus("signed");
      setModalOpen(false);
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  async function startPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/${slug}/checkout`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok || !d.url) {
        setError(d.error ?? "Could not start checkout. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = d.url;
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      {/* ── Agreement section (#12) ─────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6">
        <div className="border-t border-hairline/70 py-14">
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">
            Agreement
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            By signing below, you agree to the terms of this business proposal
            and form a contractual agreement that begins on the date of signing.
          </p>

          <div className="mt-6 rounded-2xl border border-hairline/80 p-6">
            {signature ? (
              <div>
                <div className="rounded-xl bg-mist p-5">
                  {signature.signature_type === "drawn" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={signature.signature_data}
                      alt="Signature"
                      className="max-h-20"
                    />
                  ) : (
                    <p className="text-[30px] italic text-ink [font-family:cursive]">
                      {signature.signature_data}
                    </p>
                  )}
                </div>
                <p className="mt-3 text-[14px] text-ink-soft">
                  Signed by{" "}
                  <span className="font-medium text-ink">
                    {signature.signer_name}
                  </span>{" "}
                  on {formatDate(signature.signed_at)}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[15px] text-ink-soft">
                  Ready to move forward? Review and sign to accept this
                  proposal.
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-press"
                >
                  Review &amp; sign
                </button>
              </div>
            )}
          </div>

          {paid ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#e3f3e6] px-4 py-3 text-[14px] text-positive">
              <CheckIcon /> Payment of {priceLabel} received. Thank you!
            </div>
          ) : null}
        </div>
      </section>

      {/* spacer so the sticky bar never covers content */}
      <div className="h-28" />

      {/* ── Sticky action bar ───────────────────────────────── */}
      {!paid ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3.5">
            <div className="min-w-0">
              <p className="text-[13px] text-ink-faint">
                {signed ? "Step 2 of 2 · Payment" : "Step 1 of 2 · Signature"}
              </p>
              <p className="truncate text-[15px] font-medium text-ink">
                {signed
                  ? `Pay ${priceLabel} to get started`
                  : "Review & sign this proposal"}
              </p>
            </div>
            {confirming ? (
              <span className="flex items-center gap-2 text-[14px] text-ink-soft">
                <Spinner /> Confirming…
              </span>
            ) : signed ? (
              <button
                onClick={startPayment}
                disabled={busy}
                className="shrink-0 rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-press disabled:opacity-50"
              >
                {busy ? "Redirecting…" : `Pay ${priceLabel}`}
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="shrink-0 rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-press"
              >
                Review &amp; sign
              </button>
            )}
          </div>
          {error && !modalOpen ? (
            <p className="mx-auto max-w-3xl px-6 pb-2 text-[13px] text-[#c0392b]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Signature modal ─────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[20px] font-semibold tracking-tight text-ink">
                Sign this proposal
              </h3>
              <p className="mt-1 text-[14px] text-ink-soft">
                Your signature confirms acceptance of the terms above.
              </p>

              {/* mode toggle */}
              <div className="mt-5 flex gap-1 rounded-full bg-mist p-1">
                {(["typed", "drawn"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex-1 rounded-full py-2 text-[14px] font-medium transition-colors",
                      mode === m
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-soft",
                    )}
                  >
                    {m === "typed" ? "Type" : "Draw"}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-ink">
                    Full name
                  </span>
                  <input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                </label>

                {mode === "typed" ? (
                  <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-hairline bg-mist">
                    <span className="text-[30px] italic text-ink [font-family:cursive]">
                      {typedName.trim() || "Your signature"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <DrawCanvas ref={drawRef} />
                    <button
                      onClick={() => drawRef.current?.clear()}
                      className="mt-1.5 text-[13px] text-ink-faint hover:text-ink"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <label className="mt-4 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 accent-[#0071e3]"
                />
                <span className="text-[13px] leading-relaxed text-ink-soft">
                  I agree to the terms of this proposal and consent to sign
                  electronically.
                </span>
              </label>

              {error ? (
                <p className="mt-3 rounded-lg bg-[#fbeaea] px-3 py-2 text-[13px] text-[#c0392b]">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex gap-2.5">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                  className="flex-1 rounded-full bg-mist py-3 text-[15px] font-medium text-ink transition-colors hover:bg-[#e8e8ed] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSignature}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-press disabled:opacity-50"
                >
                  {busy ? <Spinner /> : null}
                  Sign &amp; continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SuccessCelebration
        show={celebrate}
        clientName={clientName}
        onClose={() => setCelebrate(false)}
      />
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
