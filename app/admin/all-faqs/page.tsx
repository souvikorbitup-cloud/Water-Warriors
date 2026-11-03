import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AllFaqsPage() {
  await requirePagePermission(PERMISSIONS.AllFaqsView);

  return (
    <UnderConstruction pageName="All FAQ's Page" classes="min-h-[80dvh]" />
  );
}
