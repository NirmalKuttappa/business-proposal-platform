import { getBookingUrl } from "@/lib/booking";

/**
 * "Book a call" section shown on public proposal pages. Renders nothing
 * when no booking link is configured, so clients never see a dead button.
 */
export function BookCallCard() {
  if (!getBookingUrl()) return null;

  return (
    <section className="mx-auto max-w-3xl px-6">
      <div className="border-t border-hairline/70 py-14">
        <div className="rounded-3xl bg-mist px-8 py-12 text-center">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">
            Want to talk it through first?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Book a quick call and we&rsquo;ll walk through this proposal
            together before you sign.
          </p>
          <a
            href="/book"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black"
          >
            Book a call
          </a>
        </div>
      </div>
    </section>
  );
}
