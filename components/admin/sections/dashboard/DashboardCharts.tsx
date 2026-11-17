"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatBucket,
  formatGrowth,
  formatINR,
  formatINRCompact,
  formatNumber,
} from "@/lib/dashboard/format";
import type { DashboardData } from "@/lib/dashboard/dashboard.types";

const C = {
  earnings: "var(--primary)",
  prev: "#94a3b8",
  orders: "#8b5cf6",
  reports: "#10b981",
  growth: "#f59e0b",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
};
const PIE = [
  "var(--primary)",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];
const STATUS_COLOR: Record<string, string> = {
  paid: "#10b981",
  created: "var(--primary)",
  ready: "#10b981",
  pending: "#94a3b8",
  generating: "#0ea5e9",
  retrying: "#f59e0b",
  failed: "#ef4444",
};

const axisProps = {
  stroke: C.axis,
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;
const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

function Panel({
  title,
  subtitle,
  children,
  className = "",
  empty,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  empty?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-card-border bg-card p-4 shadow-sm ${className}`}
    >
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      {subtitle && (
        <p className="mb-3 text-xs text-muted-foreground">
          {subtitle}
        </p>
      )}
      <div className={`${subtitle ? "" : "mt-3"} h-64`}>
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data for this selection
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Donut({
  data,
  colors,
}: {
  data: { name: string; value: number }[];
  colors?: Record<string, string>;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={colors?.[d.name] ?? PIE[i % PIE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, n) => [
            `${formatNumber(Number(v ?? 0))} (${total ? Math.round((Number(v ?? 0) / total) * 100) : 0}%)`,
            String(n),
          ]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function DashboardCharts({ data }: { data: DashboardData }) {
  const { series, monthly, orderStatus, reportStatus, coupons, range } =
    data;
  const byDay = range.bucket === "day";
  const hasSeries = series.some((s) => s.earnings || s.orders || s.reports);
  const unit = byDay ? "daily" : "monthly";

  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Panel
        className="lg:col-span-4"
        title="Earnings"
        subtitle={
          byDay
            ? "Paid orders per day, with the previous period overlaid"
            : "Paid orders per month"
        }
        empty={!hasSeries}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.earnings} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.earnings} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={C.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="key"
              tickFormatter={formatBucket}
              minTickGap={24}
              {...axisProps}
            />
            <YAxis tickFormatter={formatINRCompact} width={56} {...axisProps} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(l) => formatBucket(String(l ?? ""))}
              formatter={(v, n) => [formatINR(Number(v ?? 0)), String(n)]}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="earnings"
              name="Earnings"
              stroke={C.earnings}
              strokeWidth={2}
              fill="url(#earnFill)"
            />
            {byDay && (
              <Line
                type="monotone"
                dataKey="prevEarnings"
                name="Previous period"
                stroke={C.prev}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        className="lg:col-span-2"
        title="Orders by status"
        subtitle="Everything started in this period"
        empty={!orderStatus.length}
      >
        <Donut data={orderStatus} colors={STATUS_COLOR} />
      </Panel>

      <Panel
        className="lg:col-span-3"
        title="Reports generated vs paid orders"
        subtitle={`Reports reaching “ready” and paid orders, ${unit}`}
        empty={!hasSeries}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke={C.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="key"
              tickFormatter={formatBucket}
              minTickGap={24}
              {...axisProps}
            />
            <YAxis allowDecimals={false} width={32} {...axisProps} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(l) => formatBucket(String(l ?? ""))}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="reports"
              name="Reports"
              fill={C.reports}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="orders"
              name="Paid orders"
              stroke={C.orders}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        className="lg:col-span-3"
        title="Monthly earnings & growth"
        subtitle="Trailing 12 months (ignores the period filter); line is month-over-month growth"
        empty={!monthly.some((m) => m.earnings)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthly}
            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke={C.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="key" tickFormatter={formatBucket} {...axisProps} />
            <YAxis
              yAxisId="l"
              tickFormatter={formatINRCompact}
              width={56}
              {...axisProps}
            />
            <YAxis
              yAxisId="r"
              orientation="right"
              tickFormatter={(v) => `${v}%`}
              width={44}
              {...axisProps}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(l) => formatBucket(String(l ?? ""))}
              formatter={(v, n) =>
                n === "MoM growth"
                  ? [v == null ? "—" : formatGrowth(Number(v)), String(n)]
                  : [formatINR(Number(v ?? 0)), String(n)]
              }
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="l"
              dataKey="earnings"
              name="Earnings"
              fill={C.earnings}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="growth"
              name="MoM growth"
              stroke={C.growth}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        className="lg:col-span-2"
        title="Report pipeline"
        subtitle="Report sessions by status"
        empty={!reportStatus.length}
      >
        <Donut data={reportStatus} colors={STATUS_COLOR} />
      </Panel>

      <Panel
        className="lg:col-span-4"
        title="Top coupons"
        subtitle="Paid orders using each code"
        empty={!coupons.length}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={coupons}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              stroke={C.grid}
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="name" width={90} {...axisProps} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [formatNumber(Number(v ?? 0)), "Orders"]}
            />
            <Bar
              dataKey="value"
              fill={C.growth}
              radius={[0, 3, 3, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
