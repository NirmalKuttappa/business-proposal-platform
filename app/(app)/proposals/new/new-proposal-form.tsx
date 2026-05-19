"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Spinner, inputClass } from "@/components/ui";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export function NewProposalForm() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientCompany,
          clientEmail,
          currency,
          amount,
          brief,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/proposals/${data.id}/edit`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Client name">
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={inputClass}
              placeholder="Alex Morgan"
            />
          </Field>
          <Field label="Client company">
            <input
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              className={inputClass}
              placeholder="Northwind Co."
            />
          </Field>
        </div>

        <Field
          label="Client email"
          hint="Optional — used for status notifications."
        >
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className={inputClass}
            placeholder="alex@northwind.com"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Proposal total" hint="The amount the client will pay.">
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="5000"
            />
          </Field>
        </div>

        <Field
          label="Project brief"
          hint="One or two paragraphs describing the work, the client, and goals."
        >
          <textarea
            required
            rows={6}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Northwind Co. is a regional retailer launching an online store. They need a 10-week engagement to design and build a Shopify storefront, migrate their catalog, and train their team. The priority is a fast, polished launch ahead of the holiday season."
          />
        </Field>

        {error ? (
          <p className="rounded-lg bg-[#fbeaea] px-3 py-2 text-[13px] text-[#c0392b]">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? <Spinner /> : null}
          {loading ? "Drafting…" : "Generate proposal"}
        </Button>
      </form>

      {loading ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <Spinner className="size-7 text-accent" />
          <p className="mt-5 text-[17px] font-medium text-ink">
            Drafting your proposal…
          </p>
          <p className="mt-1 text-[14px] text-ink-soft">
            Claude is writing all 12 sections. This usually takes under a minute.
          </p>
        </div>
      ) : null}
    </>
  );
}
