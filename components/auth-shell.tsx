import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-mist px-6 py-16">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="mb-8 block text-center text-[19px] font-semibold tracking-tight text-ink"
        >
          Proposals
        </Link>
        <div className="rounded-3xl border border-hairline/70 bg-white p-8 shadow-sm">
          <h1 className="text-center text-[24px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-center text-[15px] text-ink-soft">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <p className="mt-5 text-center text-[14px] text-ink-soft">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}
