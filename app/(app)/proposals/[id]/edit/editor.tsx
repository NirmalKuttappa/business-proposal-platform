"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Spinner, cn, inputClass } from "@/components/ui";
import { centsToDollars, dollarsToCents, formatMoney, lineItemsTotal } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Proposal, ProposalContent } from "@/lib/types";

const textareaClass = cn(inputClass, "resize-y leading-relaxed");

export function ProposalEditor({ proposal }: { proposal: Proposal }) {
  const router = useRouter();
  const [content, setContent] = useState<ProposalContent>(proposal.content);
  const [clientName, setClientName] = useState(proposal.client_name);
  const [clientCompany, setClientCompany] = useState(proposal.client_company ?? "");
  const [clientEmail, setClientEmail] = useState(proposal.client_email ?? "");
  const [currency, setCurrency] = useState(proposal.currency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Immutable structured update of the content object. */
  function mutate(fn: (draft: ProposalContent) => void) {
    setContent((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setSaved(false);
  }

  const total = lineItemsTotal(content.pricing.lineItems);

  async function save(): Promise<boolean> {
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("proposals")
      .update({
        title: content.cover.title,
        client_name: clientName,
        client_company: clientCompany || null,
        client_email: clientEmail || null,
        currency,
        amount_total: total,
        content,
      })
      .eq("id", proposal.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return false;
    }
    setSaved(true);
    return true;
  }

  async function saveAndDone() {
    if (await save()) {
      router.push(`/proposals/${proposal.id}`);
      router.refresh();
    }
  }

  return (
    <div className="pb-24">
      {/* Sticky action bar */}
      <div className="sticky top-14 z-20 -mx-6 mb-8 border-b border-hairline/70 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/proposals/${proposal.id}`}
            className="text-[14px] text-ink-soft transition-colors hover:text-ink"
          >
            ← Cancel
          </Link>
          <div className="flex items-center gap-2.5">
            {saved ? (
              <span className="text-[13px] text-positive">Saved</span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              Save
            </Button>
            <Button size="sm" onClick={saveAndDone} disabled={saving}>
              Save & done
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            Edit proposal
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            Refine any section. Changes apply to the page your client sees.
          </p>
        </div>

        {error ? (
          <p className="rounded-lg bg-[#fbeaea] px-3 py-2 text-[13px] text-[#c0392b]">
            {error}
          </p>
        ) : null}

        {/* Client & cover */}
        <Card title="Client & cover">
          <Grid2>
            <TextField
              label="Client name"
              value={clientName}
              onChange={setClientName}
            />
            <TextField
              label="Client company"
              value={clientCompany}
              onChange={setClientCompany}
            />
          </Grid2>
          <TextField
            label="Client email"
            value={clientEmail}
            onChange={setClientEmail}
          />
          <TextField
            label="Proposal title"
            value={content.cover.title}
            onChange={(v) => mutate((d) => (d.cover.title = v))}
          />
          <AreaField
            label="Intro line"
            rows={2}
            value={content.cover.intro}
            onChange={(v) => mutate((d) => (d.cover.intro = v))}
          />
          <Grid2>
            <TextField
              label="Prepared for"
              value={content.cover.preparedFor}
              onChange={(v) => mutate((d) => (d.cover.preparedFor = v))}
            />
            <TextField
              label="Created by"
              value={content.cover.createdBy}
              onChange={(v) => mutate((d) => (d.cover.createdBy = v))}
            />
          </Grid2>
        </Card>

        {/* Company overview */}
        <Card title="Company overview">
          <AreaField
            label="Body"
            rows={5}
            value={content.companyOverview.body}
            onChange={(v) => mutate((d) => (d.companyOverview.body = v))}
          />
        </Card>

        {/* Executive summary */}
        <Card title="Executive summary">
          <AreaField
            label="Intro"
            rows={3}
            value={content.executiveSummary.intro}
            onChange={(v) => mutate((d) => (d.executiveSummary.intro = v))}
          />
          <Repeater
            label="Team member"
            items={content.executiveSummary.teamMembers}
            onAdd={() =>
              mutate((d) =>
                d.executiveSummary.teamMembers.push({
                  name: "",
                  role: "",
                  bio: "",
                }),
              )
            }
            onRemove={(i) =>
              mutate((d) => d.executiveSummary.teamMembers.splice(i, 1))
            }
            render={(m, i) => (
              <>
                <Grid2>
                  <TextField
                    label="Name"
                    value={m.name}
                    onChange={(v) =>
                      mutate((d) => (d.executiveSummary.teamMembers[i].name = v))
                    }
                  />
                  <TextField
                    label="Role"
                    value={m.role}
                    onChange={(v) =>
                      mutate((d) => (d.executiveSummary.teamMembers[i].role = v))
                    }
                  />
                </Grid2>
                <AreaField
                  label="Bio"
                  rows={2}
                  value={m.bio}
                  onChange={(v) =>
                    mutate((d) => (d.executiveSummary.teamMembers[i].bio = v))
                  }
                />
              </>
            )}
          />
        </Card>

        {/* Testimonials */}
        <Card title="Client testimonials">
          <Repeater
            label="Testimonial"
            items={content.testimonials}
            onAdd={() =>
              mutate((d) =>
                d.testimonials.push({ name: "", jobTitle: "", quote: "" }),
              )
            }
            onRemove={(i) => mutate((d) => d.testimonials.splice(i, 1))}
            render={(t, i) => (
              <>
                <Grid2>
                  <TextField
                    label="Name"
                    value={t.name}
                    onChange={(v) =>
                      mutate((d) => (d.testimonials[i].name = v))
                    }
                  />
                  <TextField
                    label="Job title"
                    value={t.jobTitle}
                    onChange={(v) =>
                      mutate((d) => (d.testimonials[i].jobTitle = v))
                    }
                  />
                </Grid2>
                <AreaField
                  label="Quote"
                  rows={2}
                  value={t.quote}
                  onChange={(v) => mutate((d) => (d.testimonials[i].quote = v))}
                />
              </>
            )}
          />
        </Card>

        {/* Scope of work */}
        <Card title="Scope of work">
          <AreaField
            label="Body"
            rows={5}
            value={content.scopeOfWork.body}
            onChange={(v) => mutate((d) => (d.scopeOfWork.body = v))}
          />
        </Card>

        {/* Challenges & goals */}
        <Card title="Challenges & goals">
          <StringList
            label="Challenge"
            items={content.challengesAndGoals.challenges}
            onAdd={() =>
              mutate((d) => d.challengesAndGoals.challenges.push(""))
            }
            onRemove={(i) =>
              mutate((d) => d.challengesAndGoals.challenges.splice(i, 1))
            }
            onChange={(i, v) =>
              mutate((d) => (d.challengesAndGoals.challenges[i] = v))
            }
          />
          <StringList
            label="Goal"
            items={content.challengesAndGoals.goals}
            onAdd={() => mutate((d) => d.challengesAndGoals.goals.push(""))}
            onRemove={(i) =>
              mutate((d) => d.challengesAndGoals.goals.splice(i, 1))
            }
            onChange={(i, v) =>
              mutate((d) => (d.challengesAndGoals.goals[i] = v))
            }
          />
        </Card>

        {/* Deliverables */}
        <Card title="Deliverables & timeline">
          <Repeater
            label="Deliverable"
            items={content.deliverablesAndTimeline.deliverables}
            onAdd={() =>
              mutate((d) =>
                d.deliverablesAndTimeline.deliverables.push({
                  name: "",
                  timeline: "",
                }),
              )
            }
            onRemove={(i) =>
              mutate((d) =>
                d.deliverablesAndTimeline.deliverables.splice(i, 1),
              )
            }
            render={(dv, i) => (
              <Grid2>
                <TextField
                  label="Deliverable"
                  value={dv.name}
                  onChange={(v) =>
                    mutate(
                      (d) =>
                        (d.deliverablesAndTimeline.deliverables[i].name = v),
                    )
                  }
                />
                <TextField
                  label="Timeline"
                  value={dv.timeline}
                  onChange={(v) =>
                    mutate(
                      (d) =>
                        (d.deliverablesAndTimeline.deliverables[i].timeline =
                          v),
                    )
                  }
                />
              </Grid2>
            )}
          />
        </Card>

        {/* Project overview */}
        <Card title="Project overview">
          <AreaField
            label="Body"
            rows={6}
            value={content.projectOverview.body}
            onChange={(v) => mutate((d) => (d.projectOverview.body = v))}
          />
        </Card>

        {/* Pricing */}
        <Card title="Terms & pricing">
          <p className="text-[13px] text-ink-soft">
            The total below is the amount your client pays.
          </p>
          <Repeater
            label="Line item"
            items={content.pricing.lineItems}
            onAdd={() =>
              mutate((d) =>
                d.pricing.lineItems.push({
                  product: "",
                  description: "",
                  unitPrice: 0,
                  quantity: 1,
                }),
              )
            }
            onRemove={(i) => mutate((d) => d.pricing.lineItems.splice(i, 1))}
            render={(li, i) => (
              <>
                <TextField
                  label="Item"
                  value={li.product}
                  onChange={(v) =>
                    mutate((d) => (d.pricing.lineItems[i].product = v))
                  }
                />
                <TextField
                  label="Description"
                  value={li.description}
                  onChange={(v) =>
                    mutate((d) => (d.pricing.lineItems[i].description = v))
                  }
                />
                <Grid2>
                  <NumberField
                    label={`Unit price (${currency})`}
                    value={centsToDollars(li.unitPrice)}
                    onChange={(v) =>
                      mutate(
                        (d) =>
                          (d.pricing.lineItems[i].unitPrice =
                            dollarsToCents(v)),
                      )
                    }
                  />
                  <NumberField
                    label="Quantity"
                    value={li.quantity}
                    onChange={(v) =>
                      mutate(
                        (d) =>
                          (d.pricing.lineItems[i].quantity =
                            Math.max(0, Math.round(Number(v) || 0))),
                      )
                    }
                  />
                </Grid2>
              </>
            )}
          />
          <div className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
            <span className="text-[14px] font-medium text-ink">Total</span>
            <span className="text-[16px] font-semibold tabular-nums text-ink">
              {formatMoney(total, currency)}
            </span>
          </div>
          <SelectField
            label="Currency"
            value={currency}
            options={["USD", "EUR", "GBP", "CAD", "AUD"]}
            onChange={setCurrency}
          />
        </Card>

        {/* Payment schedule */}
        <Card title="Payment schedule">
          <Repeater
            label="Payment"
            items={content.paymentSchedule}
            onAdd={() =>
              mutate((d) =>
                d.paymentSchedule.push({
                  description: "",
                  amount: 0,
                  dueDate: "",
                }),
              )
            }
            onRemove={(i) => mutate((d) => d.paymentSchedule.splice(i, 1))}
            render={(p, i) => (
              <>
                <TextField
                  label="Description"
                  value={p.description}
                  onChange={(v) =>
                    mutate((d) => (d.paymentSchedule[i].description = v))
                  }
                />
                <Grid2>
                  <NumberField
                    label={`Amount (${currency})`}
                    value={centsToDollars(p.amount)}
                    onChange={(v) =>
                      mutate(
                        (d) =>
                          (d.paymentSchedule[i].amount = dollarsToCents(v)),
                      )
                    }
                  />
                  <TextField
                    label="Due date"
                    value={p.dueDate}
                    onChange={(v) =>
                      mutate((d) => (d.paymentSchedule[i].dueDate = v))
                    }
                  />
                </Grid2>
              </>
            )}
          />
        </Card>

        {/* Contract */}
        <Card title="Sales contract">
          <AreaField
            label="Intro"
            rows={3}
            value={content.contract.intro}
            onChange={(v) => mutate((d) => (d.contract.intro = v))}
          />
          <Repeater
            label="Clause"
            items={content.contract.clauses}
            onAdd={() =>
              mutate((d) =>
                d.contract.clauses.push({ heading: "", body: "" }),
              )
            }
            onRemove={(i) => mutate((d) => d.contract.clauses.splice(i, 1))}
            render={(cl, i) => (
              <>
                <TextField
                  label="Heading"
                  value={cl.heading}
                  onChange={(v) =>
                    mutate((d) => (d.contract.clauses[i].heading = v))
                  }
                />
                <AreaField
                  label="Body"
                  rows={3}
                  value={cl.body}
                  onChange={(v) =>
                    mutate((d) => (d.contract.clauses[i].body = v))
                  }
                />
              </>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

/* ── small editor primitives ──────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline/80 bg-white p-5">
      <h2 className="text-[16px] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-ink">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function AreaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={textareaClass}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Repeater<T>({
  label,
  items,
  render,
  onAdd,
  onRemove,
}: {
  label: string;
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-hairline/70 bg-mist/50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              {label} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-[13px] text-ink-faint transition-colors hover:text-[#c0392b]"
            >
              Remove
            </button>
          </div>
          {render(item, i)}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-[14px] font-medium text-accent hover:underline"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}

function StringList({
  label,
  items,
  onAdd,
  onRemove,
  onChange,
}: {
  label: string;
  items: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}s</FieldLabel>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => onChange(i, e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="shrink-0 px-2 text-[13px] text-ink-faint transition-colors hover:text-[#c0392b]"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-[14px] font-medium text-accent hover:underline"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}
