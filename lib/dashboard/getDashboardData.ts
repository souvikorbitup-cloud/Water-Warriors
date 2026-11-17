import "server-only";

import BillingOrder from "@/lib/models/BillingOrder.model";
import ReportSession from "@/lib/models/ReportSession.model";
import {
  addMonths,
  bucketKeys,
  resolveRange,
  startOfMonth,
  todayIst,
  istStart,
} from "./range";
import {
  type DashboardData,
  type DashboardFilters,
  type MonthlyPoint,
  type NamedValue,
  type SeriesPoint,
} from "@/lib/dashboard/dashboard.types";
import { connectDB } from "../db";

const TZ = "+05:30";
const rupees = (paise: number) => Math.round(paise) / 100;
const growth = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
interface Bucketed {
  _id: string;
  earnings?: number;
  count: number;
}

export async function getDashboardData(
  filters: DashboardFilters,
): Promise<DashboardData> {
  await connectDB();
  const r = resolveRange(filters);

  const fmt = r.bucket === "day" ? "%Y-%m-%d" : "%Y-%m";
  const paidIn = (start: Date, end: Date) => ({
    status: "paid" as const,
    paidAt: { $gte: start, $lt: end },
  });
  const sessionsIn = (start: Date, end: Date, ready = true) => ({
    ...(ready ? { status: "ready" as const } : {}),
    createdAt: { $gte: start, $lt: end },
  });

  const totalsOf = (start: Date, end: Date) =>
    BillingOrder.aggregate<{ _id: null; sum: number; count: number }>([
      { $match: paidIn(start, end) },
      {
        $group: {
          _id: null,
          sum: { $sum: "$amountPaise" },
          count: { $sum: 1 },
        },
      },
    ]);

  const dailyEarnings = (start: Date, end: Date, format: string) =>
    BillingOrder.aggregate<Bucketed>([
      { $match: paidIn(start, end) },
      {
        $group: {
          _id: { $dateToString: { format, date: "$paidAt", timezone: TZ } },
          earnings: { $sum: "$amountPaise" },
          count: { $sum: 1 },
        },
      },
    ]);

  /* ---------- 12-month trend (always the trailing 12 months) ---------- */
  const monthFrom = addMonths(startOfMonth(todayIst()), -11);
  const trendEnd = r.end > new Date() ? r.end : new Date();

  const [
    cur,
    prev,
    reportsCur,
    reportsPrev,
    reportsAllTime,
    earningsSeries,
    prevEarningsSeries,
    reportsSeries,
    trend,
    orderStatusRows,
    reportStatusRows,
    couponRows,
  ] = await Promise.all([
    totalsOf(r.start, r.end),
    totalsOf(r.prevStart, r.prevEnd),
    ReportSession.countDocuments(sessionsIn(r.start, r.end)),
    ReportSession.countDocuments(sessionsIn(r.prevStart, r.prevEnd)),
    ReportSession.countDocuments({ status: "ready" }),
    dailyEarnings(r.start, r.end, fmt),
    r.bucket === "day"
      ? dailyEarnings(r.prevStart, r.prevEnd, "%Y-%m-%d")
      : Promise.resolve([] as Bucketed[]),
    ReportSession.aggregate<Bucketed>([
      { $match: sessionsIn(r.start, r.end) },
      {
        $group: {
          _id: {
            $dateToString: { format: fmt, date: "$createdAt", timezone: TZ },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    BillingOrder.aggregate<Bucketed>([
      { $match: paidIn(istStart(monthFrom), trendEnd) },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$paidAt", timezone: TZ },
          },
          earnings: { $sum: "$amountPaise" },
          count: { $sum: 1 },
        },
      },
    ]),
    BillingOrder.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: r.start, $lt: r.end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ReportSession.aggregate<{ _id: string; count: number }>([
      { $match: sessionsIn(r.start, r.end, false) },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    BillingOrder.aggregate<{ _id: string; count: number; earnings: number }>([
      {
        $match: { ...paidIn(r.start, r.end), couponCode: { $nin: [null, ""] } },
      },
      {
        $group: {
          _id: "$couponCode",
          count: { $sum: 1 },
          earnings: { $sum: "$amountPaise" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
  ]);

  /* ---------- KPIs ---------- */
  const earnings = rupees(cur[0]?.sum ?? 0);
  const prevEarnings = rupees(prev[0]?.sum ?? 0);
  const paidOrders = cur[0]?.count ?? 0;
  const prevPaidOrders = prev[0]?.count ?? 0;
  const avg = paidOrders ? earnings / paidOrders : 0;
  const prevAvg = prevPaidOrders ? prevEarnings / prevPaidOrders : 0;
  const statusCount = (rows: { _id: string; count: number }[], key: string) =>
    rows.find((x) => x._id === key)?.count ?? 0;
  const ordersInRange = orderStatusRows.reduce((s, x) => s + x.count, 0);
  const sessionsInRange = reportStatusRows.reduce((s, x) => s + x.count, 0);

  /* ---------- series (zero-filled so charts have no gaps) ---------- */
  const eMap = new Map(earningsSeries.map((x) => [x._id, x]));
  const rMap = new Map(reportsSeries.map((x) => [x._id, x.count]));
  const pMap = new Map(prevEarningsSeries.map((x) => [x._id, x.earnings ?? 0]));
  const keys = bucketKeys(r.from, r.to, r.bucket);
  const prevKeys =
    r.bucket === "day" ? bucketKeys(r.prevFrom, r.prevTo, "day") : [];
  const series: SeriesPoint[] = keys.map((key, i) => ({
    key,
    earnings: rupees(eMap.get(key)?.earnings ?? 0),
    prevEarnings: rupees(pMap.get(prevKeys[i]) ?? 0),
    orders: eMap.get(key)?.count ?? 0,
    reports: rMap.get(key) ?? 0,
  }));

  const tMap = new Map(trend.map((x) => [x._id, x]));
  const monthly: MonthlyPoint[] = [];
  let lastEarn: number | null = null;
  for (const key of bucketKeys(monthFrom, todayIst(), "month")) {
    const e = rupees(tMap.get(key)?.earnings ?? 0);
    monthly.push({
      key,
      earnings: e,
      orders: tMap.get(key)?.count ?? 0,
      growth: lastEarn === null ? null : growth(e, lastEarn),
    });
    lastEarn = e;
  }

  /* ---------- breakdowns ---------- */
  const named = (rows: { _id: string; count: number }[]): NamedValue[] =>
    rows
      .map((x) => ({ name: x._id, value: x.count }))
      .filter((x) => x.value > 0);

  return {
    range: {
      preset: r.preset,
      from: r.from,
      to: r.to,
      prevFrom: r.prevFrom,
      prevTo: r.prevTo,
      bucket: r.bucket,
    },
    kpis: {
      earnings,
      prevEarnings,
      earningsGrowth: growth(earnings, prevEarnings),
      paidOrders,
      prevPaidOrders,
      ordersGrowth: growth(paidOrders, prevPaidOrders),
      reportsGenerated: reportsCur,
      prevReportsGenerated: reportsPrev,
      reportsGrowth: growth(reportsCur, reportsPrev),
      totalReportsAllTime: reportsAllTime,
      avgOrderValue: Math.round(avg * 100) / 100,
      prevAvgOrderValue: Math.round(prevAvg * 100) / 100,
      aovGrowth: growth(avg, prevAvg),
      conversionRate: pct(statusCount(orderStatusRows, "paid"), ordersInRange),
      discountedOrders: couponRows.reduce((s, x) => s + x.count, 0),
      reportSuccessRate: pct(
        statusCount(reportStatusRows, "ready"),
        sessionsInRange,
      ),
    },
    series,
    monthly,
    orderStatus: named(orderStatusRows),
    reportStatus: named(reportStatusRows),
    coupons: couponRows.map((x) => ({
      name: x._id,
      value: x.count,
    })),
  };
}
