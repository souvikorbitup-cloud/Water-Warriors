import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function TeamMembersPage() {
  await requirePagePermission(PERMISSIONS.AllTeamMembersView);

  return (
    <UnderConstruction pageName="Team Members Page" classes="min-h-[80dvh]" />
  );
}
