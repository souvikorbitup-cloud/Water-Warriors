import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function DIYGuidesPage() {
  await requirePagePermission(PERMISSIONS.AllDIYGuidesView);

  return (
    <UnderConstruction pageName="DIY Guides Page" classes="min-h-[80dvh]" />
  );
}
