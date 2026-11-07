import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import FaqsManager from "@/components/admin/sections/content/FaqsManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listFaqs } from "@/lib/content/faq-service";

export const metadata: Metadata = {
  title: "All FAQs",
};

export default function AllFaqsPage() {
  return (
    <Suspense
      fallback={<SubmissionsPageSkeleton title="All FAQs" columns={6} />}
    >
      <AllFaqsContent />
    </Suspense>
  );
}

async function AllFaqsContent() {
  const user = await requirePagePermission(PERMISSIONS.AllFaqsView);
  const initialData = await listFaqs({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "order:asc",
    group: "",
  });

  return (
    <FaqsManager
      canEdit={canAccess(user.role, PERMISSIONS.AllFaqsEdit)}
      initialData={initialData}
    />
  );
}
