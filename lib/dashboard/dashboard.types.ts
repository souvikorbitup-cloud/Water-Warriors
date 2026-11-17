export const DASHBOARD_PRESETS = [
  "today",
  "last_7",
  "last_30",
  "this_month",
  "last_month",
  "last_3_months",
  "this_year",
  "custom",
] as const;
export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export const PRESET_LABELS: Record<DashboardPreset, string> = {
  today: "Today",
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  this_year: "This year",
  custom: "Custom range",
};

export interface DashboardFilters {
  preset: DashboardPreset;
  from: string; // YYYY-MM-DD (IST), only used for "custom"
  to: string; // YYYY-MM-DD (IST), only used for "custom"
}

export interface Kpis {
  earnings: number; // rupees
  prevEarnings: number;
  earningsGrowth: number | null; // % (null = no previous data to compare)
  paidOrders: number;
  prevPaidOrders: number;
  ordersGrowth: number | null;
  reportsGenerated: number;
  prevReportsGenerated: number;
  reportsGrowth: number | null;
  totalReportsAllTime: number;
  avgOrderValue: number;
  prevAvgOrderValue: number;
  aovGrowth: number | null;
  conversionRate: number; // % of orders in range that were paid
  discountedOrders: number;
  reportSuccessRate: number; // % of sessions in range that are "ready"
}

export interface SeriesPoint {
  key: string; // YYYY-MM-DD or YYYY-MM
  earnings: number;
  prevEarnings: number;
  orders: number;
  reports: number;
}

export interface MonthlyPoint {
  key: string; // YYYY-MM
  earnings: number;
  orders: number;
  growth: number | null; // vs previous month
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface DashboardData {
  range: {
    preset: DashboardPreset;
    from: string;
    to: string;
    prevFrom: string;
    prevTo: string;
    bucket: "day" | "month";
  };
  kpis: Kpis;
  series: SeriesPoint[];
  monthly: MonthlyPoint[];
  orderStatus: NamedValue[];
  reportStatus: NamedValue[];
  coupons: NamedValue[];
}
