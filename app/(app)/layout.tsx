import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-hairline/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="text-[17px] font-semibold tracking-tight text-ink"
          >
            Proposals
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/book"
              target="_blank"
              className="hidden text-[14px] text-ink-soft transition-colors hover:text-ink sm:block"
            >
              Booking page
            </Link>
            <span className="hidden text-[13px] text-ink-faint sm:block">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
