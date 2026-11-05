import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function Dashboard() {
  await requirePagePermission(PERMISSIONS.dashboardView);
  return (
    <UnderConstructionAdmin pageName="Dashboard Page" classes="min-h-[80dvh]" />
  );
}
