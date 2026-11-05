import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function TeamMembersPage() {
  await requirePagePermission(PERMISSIONS.AllTeamMembersView);

  return (
    <UnderConstructionAdmin
      pageName="Team Members Page"
      classes="min-h-[80dvh]"
    />
  );
}
