import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function DIYGuidesPage() {
  await requirePagePermission(PERMISSIONS.AllDIYGuidesView);

  return (
    <UnderConstructionAdmin
      pageName="DIY Guides Page"
      classes="min-h-[80dvh]"
    />
  );
}
