const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatINR = (n: number) => inr.format(n);
export const formatINRExact = (n: number) => inrExact.format(n);
export const formatINRCompact = (n: number) => `₹${compact.format(n)}`;
export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-IN").format(n);

export const formatGrowth = (g: number | null) =>
  g === null ? "New" : `${g > 0 ? "+" : ""}${g}%`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-11-17" -> "17 Nov", "2026-11" -> "Nov 26". */
export function formatBucket(key: string): string {
  const [y, m, d] = key.split("-");
  const month = MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month}` : `${month} ${y.slice(2)}`;
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRangeLabel = (from: string, to: string) => {
  const f = (k: string) => `${formatBucket(k)} ${k.slice(0, 4)}`;
  return from === to ? f(from) : `${f(from)} – ${f(to)}`;
};
