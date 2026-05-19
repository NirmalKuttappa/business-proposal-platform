import type { LineItem } from "./types";

/** Format integer cents as a currency string, e.g. 125000 -> "$1,250.00". */
export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
    minimumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

export function dollarsToCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): number {
  return (cents ?? 0) / 100;
}

/** Sum of unitPrice * quantity across line items, in cents. */
export function lineItemsTotal(items: LineItem[]): number {
  return items.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 0),
    0,
  );
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
