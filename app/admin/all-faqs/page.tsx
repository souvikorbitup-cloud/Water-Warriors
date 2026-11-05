import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AllFaqsPage() {
  await requirePagePermission(PERMISSIONS.AllFaqsView);

  return (
    <UnderConstructionAdmin pageName="All FAQ's Page" classes="min-h-[80dvh]" />
  );
}
