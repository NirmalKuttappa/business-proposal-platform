import type { Metadata } from "next";
import Link from "next/link";
import { getBookingUrl } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Book a call",
  description: "Pick a time for a conversation.",
};

export default function BookPage() {
  const url = getBookingUrl();

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-hairline/70">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link
            href="/"
            className="text-[17px] font-semibold tracking-tight text-ink"
          >
            Proposals
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* Avatars — the people you'll be talking to */}
        <div className="flex -space-x-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatar-1.png"
            alt=""
            className="size-20 rounded-full border-[3px] border-white object-cover object-top shadow-sm ring-1 ring-hairline/60"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatar-2.png"
            alt=""
            className="size-20 rounded-full border-[3px] border-white object-cover object-top shadow-sm ring-1 ring-hairline/60"
          />
        </div>

        <h1 className="mt-6 text-[34px] font-semibold tracking-tight text-ink">
          Book a call
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
          Pick a time that works for you — looking forward to the conversation.
        </p>

        <div className="mt-8">
          {url ? (
            <iframe
              src={url}
              title="Appointment scheduling"
              className="w-full rounded-2xl border border-hairline"
              style={{ height: 760 }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-hairline px-8 py-20 text-center">
              <p className="text-[16px] font-medium text-ink">
                Booking isn&rsquo;t available yet
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-ink-soft">
                Please check back soon, or reach out by email and we&rsquo;ll
                find a time together.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
