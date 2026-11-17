import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/dashboard/getDashboardData";
import { formatRangeLabel } from "@/lib/dashboard/format";
import { parseFilters, todayIst } from "@/lib/dashboard/range";
import DashboardCharts from "@/components/admin/sections/dashboard/DashboardCharts";
import DashboardFilters from "@/components/admin/sections/dashboard/DashboardFilters";
import KpiCards from "@/components/admin/sections/dashboard/KpiCards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePagePermission(PERMISSIONS.dashboardView);

  const filters = parseFilters(await searchParams);
  const data = await getDashboardData(filters);

  return (
    <div className="space-y-4 bg-background p-4 text-foreground md:p-6">
      <header>
        <h1 className="text-xl font-bold text-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {formatRangeLabel(data.range.from, data.range.to)} · compared with{" "}
          {formatRangeLabel(data.range.prevFrom, data.range.prevTo)} · times in
          IST
        </p>
      </header>

      <DashboardFilters
        resolvedFrom={data.range.from}
        resolvedTo={data.range.to}
        maxDate={todayIst()}
      />
      <KpiCards kpis={data.kpis} />
      <DashboardCharts data={data} />
    </div>
  );
}
