import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  IndianRupee,
  Minus,
  Percent,
  ReceiptText,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react";
import {
  formatGrowth,
  formatINR,
  formatINRExact,
  formatNumber,
} from "@/lib/dashboard/format";
import type { Kpis } from "@/lib/dashboard/dashboard.types";

function GrowthBadge({ value }: { value: number | null }) {
  const up = value !== null && value > 0;
  const down = value !== null && value < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const tone = up
    ? "bg-emerald-50 text-emerald-700"
    : down
      ? "bg-red-50 text-red-700"
      : "bg-secondary text-secondary-foreground";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {formatGrowth(value)}
      <span className="sr-only">
        {up ? "increase" : down ? "decrease" : "no change"} versus previous
        period
      </span>
    </span>
  );
}

interface CardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  growth?: number | null;
  hint: string;
  accent: string;
}

function Card({ title, value, icon: Icon, growth, hint, accent }: CardProps) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-heading">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {growth !== undefined && <GrowthBadge value={growth} />}
        <span>{hint}</span>
      </div>
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        title="Earnings"
        value={formatINR(kpis.earnings)}
        icon={IndianRupee}
        growth={kpis.earningsGrowth}
        hint={`vs ${formatINR(kpis.prevEarnings)} prev. period`}
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Reports generated"
        value={formatNumber(kpis.reportsGenerated)}
        icon={FileText}
        growth={kpis.reportsGrowth}
        hint={`${formatNumber(kpis.totalReportsAllTime)} all-time`}
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Paid orders"
        value={formatNumber(kpis.paidOrders)}
        icon={ShoppingCart}
        growth={kpis.ordersGrowth}
        hint={`vs ${formatNumber(kpis.prevPaidOrders)} prev. period`}
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Avg. order value"
        value={formatINRExact(kpis.avgOrderValue)}
        icon={ReceiptText}
        growth={kpis.aovGrowth}
        hint={`vs ${formatINRExact(kpis.prevAvgOrderValue)} prev.`}
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Payment conversion"
        value={`${kpis.conversionRate}%`}
        icon={Percent}
        hint="Orders started that were paid"
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Report success rate"
        value={`${kpis.reportSuccessRate}%`}
        icon={FileText}
        hint="Sessions that reached “ready”"
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Coupon-discounted orders"
        value={formatNumber(kpis.discountedOrders)}
        icon={Tag}
        hint="Paid orders that used a coupon"
        accent="bg-secondary text-secondary-foreground"
      />
      <Card
        title="Earnings per report"
        value={
          kpis.reportsGenerated
            ? formatINRExact(kpis.earnings / kpis.reportsGenerated)
            : "—"
        }
        icon={IndianRupee}
        hint="Earnings ÷ reports in period"
        accent="bg-secondary text-secondary-foreground"
      />
    </div>
  );
}
