import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import TeamMembersManager from "@/components/admin/sections/content/TeamMembersManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listTeamMembers } from "@/lib/content/team-member-service";

export const metadata: Metadata = {
  title: "Team Members",
};

export default function TeamMembersPage() {
  return (
    <Suspense
      fallback={<SubmissionsPageSkeleton title="Team Members" columns={6} />}
    >
      <TeamMembersContent />
    </Suspense>
  );
}

async function TeamMembersContent() {
  const user = await requirePagePermission(PERMISSIONS.AllTeamMembersView);
  const initialData = await listTeamMembers({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "order:asc",
    group: "",
  });

  return (
    <TeamMembersManager
      canEdit={canAccess(user.role, PERMISSIONS.AllTeamMembersEdit)}
      initialData={initialData}
    />
  );
}
