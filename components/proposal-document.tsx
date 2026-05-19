import { formatMoney, lineItemsTotal } from "@/lib/format";
import type { Proposal } from "@/lib/types";
import type { ReactNode } from "react";

/**
 * Presentational renderer for a proposal's 12 content sections.
 * Sections 1-11 are rendered here; the public page appends the
 * interactive Agreement (sign + pay) section after this.
 */
export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const c = proposal.content;
  const currency = proposal.currency;
  const total = lineItemsTotal(c.pricing?.lineItems ?? []);

  return (
    <article className="mx-auto max-w-3xl px-6">
      {/* 1 — Cover */}
      <header className="py-16 sm:py-24">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Business Proposal
        </p>
        <h1 className="mt-4 text-[40px] font-semibold leading-[1.06] tracking-[-0.02em] text-ink sm:text-[54px]">
          {c.cover?.title}
        </h1>
        {c.cover?.intro ? (
          <p className="mt-5 max-w-2xl text-[19px] leading-relaxed text-ink-soft">
            {c.cover.intro}
          </p>
        ) : null}
        <dl className="mt-12 grid max-w-lg gap-7 sm:grid-cols-2">
          <Meta label="Prepared for" value={c.cover?.preparedFor} />
          <Meta label="Created by" value={c.cover?.createdBy} />
        </dl>
      </header>

      {/* 2 — Company overview */}
      <Section title="Company overview">
        <Prose text={c.companyOverview?.body} />
      </Section>

      {/* 3 — Executive summary */}
      <Section title="Executive summary">
        <Prose text={c.executiveSummary?.intro} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(c.executiveSummary?.teamMembers ?? []).map((m, i) => (
            <div key={i} className="rounded-2xl bg-mist p-5">
              <p className="text-[16px] font-semibold text-ink">{m.name}</p>
              <p className="text-[13px] text-ink-faint">{m.role}</p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">
                {m.bio}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4 — Testimonials */}
      {(c.testimonials?.length ?? 0) > 0 ? (
        <Section title="Client testimonials">
          <div className="grid gap-6 sm:grid-cols-3">
            {c.testimonials.map((t, i) => (
              <figure key={i} className="flex flex-col">
                <blockquote className="text-[15px] leading-relaxed text-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-3 text-[13px] text-ink-faint">
                  <span className="font-medium text-ink-soft">{t.name}</span>
                  {t.jobTitle ? ` · ${t.jobTitle}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 5 — Scope of work */}
      <Section title="Scope of work">
        <Prose text={c.scopeOfWork?.body} />
      </Section>

      {/* 6 — Challenges & goals */}
      <Section title="Challenges & goals">
        <div className="grid gap-10 sm:grid-cols-2">
          <List heading="Challenges" items={c.challengesAndGoals?.challenges} />
          <List
            heading="Goals & objectives"
            items={c.challengesAndGoals?.goals}
          />
        </div>
      </Section>

      {/* 7 — Deliverables & timeline */}
      <Section title="Deliverables & timeline">
        <div className="overflow-hidden rounded-2xl border border-hairline/80">
          {(c.deliverablesAndTimeline?.deliverables ?? []).map((d, i) => (
            <div
              key={i}
              className={`flex items-baseline justify-between gap-4 px-5 py-3.5 ${
                i > 0 ? "border-t border-hairline/70" : ""
              }`}
            >
              <span className="text-[15px] text-ink">{d.name}</span>
              <span className="shrink-0 text-[13px] text-ink-faint">
                {d.timeline}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* 8 — Project overview */}
      <Section title="Project overview">
        <Prose text={c.projectOverview?.body} />
      </Section>

      {/* 9 — Terms & pricing */}
      <Section title="Terms & pricing">
        <div className="overflow-hidden rounded-2xl border border-hairline/80">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-6 bg-mist px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-faint sm:grid">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Amount</span>
          </div>
          {(c.pricing?.lineItems ?? []).map((li, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-t border-hairline/70 px-5 py-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <div className="min-w-0">
                <p className="text-[15px] text-ink">{li.product}</p>
                {li.description ? (
                  <p className="mt-0.5 text-[13px] text-ink-faint">
                    {li.description}
                  </p>
                ) : null}
              </div>
              <span className="hidden text-right text-[14px] tabular-nums text-ink-soft sm:block">
                {li.quantity}
              </span>
              <span className="text-right text-[15px] tabular-nums text-ink">
                {formatMoney(li.unitPrice * li.quantity, currency)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-hairline bg-mist px-5 py-4">
            <span className="text-[15px] font-semibold text-ink">Total</span>
            <span className="text-[18px] font-semibold tabular-nums text-ink">
              {formatMoney(total, currency)}
            </span>
          </div>
        </div>
      </Section>

      {/* 10 — Payment schedule */}
      {(c.paymentSchedule?.length ?? 0) > 0 ? (
        <Section title="Payment schedule">
          <div className="overflow-hidden rounded-2xl border border-hairline/80">
            {c.paymentSchedule.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                  i > 0 ? "border-t border-hairline/70" : ""
                }`}
              >
                <div>
                  <p className="text-[15px] text-ink">{p.description}</p>
                  <p className="text-[13px] text-ink-faint">{p.dueDate}</p>
                </div>
                <span className="shrink-0 text-[15px] tabular-nums text-ink">
                  {formatMoney(p.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 11 — Sales contract */}
      <Section title="Product / service sales contract">
        <Prose text={c.contract?.intro} />
        <div className="mt-6 space-y-5">
          {(c.contract?.clauses ?? []).map((cl, i) => (
            <div key={i}>
              <h3 className="text-[15px] font-semibold text-ink">
                {i + 1}. {cl.heading}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                {cl.body}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-hairline/70 py-14">
      <h2 className="text-[22px] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] text-ink">{value || "—"}</dd>
    </div>
  );
}

function Prose({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="prose-proposal">{text}</div>;
}

function List({ heading, items }: { heading: string; items?: string[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {heading}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {(items ?? []).map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] text-ink-soft">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
