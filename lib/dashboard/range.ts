import {
  DASHBOARD_PRESETS,
  type DashboardFilters,
  type DashboardPreset,
} from "@/lib/dashboard/dashboard.types";

/** All dashboard dates are calendar days in India Standard Time (UTC+05:30). */
const IST = "+05:30";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 731;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const ymdOf = (d: Date) => d.toISOString().slice(0, 10);
const parseYmd = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`);

export const todayIst = () => ymdOf(new Date(Date.now() + IST_OFFSET_MS));
export const addDays = (ymd: string, n: number) =>
  ymdOf(new Date(parseYmd(ymd) + n * DAY_MS));
export const startOfMonth = (ymd: string) => `${ymd.slice(0, 8)}01`;
export const addMonths = (ymd: string, n: number) => {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  return ymdOf(new Date(Date.UTC(y, m - 1 + n, 1)));
};
export const daysBetween = (from: string, to: string) =>
  Math.round((parseYmd(to) - parseYmd(from)) / DAY_MS) + 1;

/** Midnight IST of a YYYY-MM-DD day, as a real Date. */
export const istStart = (ymd: string) => new Date(`${ymd}T00:00:00${IST}`);

export interface ResolvedRange {
  preset: DashboardPreset;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  /** Inclusive start / exclusive end, ready for Mongo queries. */
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  bucket: "day" | "month";
  days: number;
}

export function resolveRange(filters: DashboardFilters): ResolvedRange {
  const today = todayIst();
  let preset = filters.preset;
  let from: string;
  let to: string;

  switch (preset) {
    case "today":
      from = to = today;
      break;
    case "last_7":
      from = addDays(today, -6);
      to = today;
      break;
    case "this_month":
      from = startOfMonth(today);
      to = today;
      break;
    case "last_month":
      from = addMonths(startOfMonth(today), -1);
      to = addDays(startOfMonth(today), -1);
      break;
    case "last_3_months":
      from = addMonths(startOfMonth(today), -2);
      to = today;
      break;
    case "this_year":
      from = `${today.slice(0, 4)}-01-01`;
      to = today;
      break;
    case "custom":
      if (YMD.test(filters.from) && YMD.test(filters.to)) {
        from = filters.from <= filters.to ? filters.from : filters.to;
        to = filters.from <= filters.to ? filters.to : filters.from;
        if (to > today) to = today;
        if (from > to) from = to;
        if (daysBetween(from, to) > MAX_RANGE_DAYS) {
          from = addDays(to, -(MAX_RANGE_DAYS - 1));
        }
        break;
      }
      preset = "last_30"; // invalid custom dates -> sane default
    // falls through
    case "last_30":
    default:
      from = addDays(today, -29);
      to = today;
  }

  const days = daysBetween(from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));

  return {
    preset,
    from,
    to,
    prevFrom,
    prevTo,
    start: istStart(from),
    end: istStart(addDays(to, 1)),
    prevStart: istStart(prevFrom),
    prevEnd: istStart(addDays(prevTo, 1)),
    bucket: days > 92 ? "month" : "day",
    days,
  };
}

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: RawParams): DashboardFilters {
  const preset = first(sp.preset) as DashboardPreset;
  return {
    preset: DASHBOARD_PRESETS.includes(preset) ? preset : "last_30",
    from: first(sp.from),
    to: first(sp.to),
  };
}

/** Every bucket key (YYYY-MM-DD or YYYY-MM) covered by a range. */
export function bucketKeys(
  from: string,
  to: string,
  bucket: "day" | "month",
): string[] {
  const keys: string[] = [];
  if (bucket === "day") {
    for (let d = from; d <= to; d = addDays(d, 1)) keys.push(d);
    return keys;
  }
  for (let m = startOfMonth(from); m <= to; m = addMonths(m, 1)) {
    keys.push(m.slice(0, 7));
  }
  return keys;
}
