import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import DiyGuidesManager from "@/components/admin/sections/content/DiyGuidesManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listDiyGuides } from "@/lib/content/diy-guide-service";

export const metadata: Metadata = {
  title: "DIY Guides",
};

export default function DIYGuidesPage() {
  return (
    <Suspense
      fallback={<SubmissionsPageSkeleton title="DIY Guides" columns={7} />}
    >
      <DiyGuidesContent />
    </Suspense>
  );
}

async function DiyGuidesContent() {
  const user = await requirePagePermission(PERMISSIONS.AllDIYGuidesView);
  const initialData = await listDiyGuides({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "order:asc",
    group: "",
  });

  return (
    <DiyGuidesManager
      canEdit={canAccess(user.role, PERMISSIONS.AllDIYGuidesEdit)}
      initialData={initialData}
    />
  );
}
