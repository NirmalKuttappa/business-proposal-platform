import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import type { ProposalStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none select-none";

const SIZES: Record<Size, string> = {
  sm: "px-4 py-1.5 text-[14px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-7 py-3.5 text-[16px]",
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-press",
  secondary: "bg-mist text-ink hover:bg-[#e8e8ed]",
  ghost: "text-ink hover:bg-mist",
  danger: "bg-[#fbeaea] text-[#c0392b] hover:bg-[#f5dcdc]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md"): string {
  return cn(BASE, SIZES[size], VARIANTS[variant]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button className={cn(buttonClass(variant, size), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link className={cn(buttonClass(variant, size), className)} {...props}>
      {children}
    </Link>
  );
}

const STATUS_STYLES: Record<ProposalStatus, string> = {
  draft: "bg-mist text-ink-soft",
  sent: "bg-[#e8f1fd] text-[#0058b9]",
  viewed: "bg-[#ece9fb] text-[#5b3fd1]",
  signed: "bg-[#fdf0dd] text-[#9a6400]",
  paid: "bg-[#e3f3e6] text-positive",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[13px] text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-ink-faint";
