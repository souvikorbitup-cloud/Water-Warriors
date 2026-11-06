import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import ContactSubmissionsManager from "@/components/admin/sections/submissions/ContactSubmissionsManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listContactSubmissions } from "@/lib/submissions/contact-service";

export const metadata: Metadata = {
  title: "Contact Us Submissions",
};
export default function ContactUsSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <SubmissionsPageSkeleton title="Contact Us Submissions" columns={5} />
      }
    >
      <ContactUsSubmissionsContent />
    </Suspense>
  );
}

async function ContactUsSubmissionsContent() {
  const user = await requirePagePermission(
    PERMISSIONS.AllContactUsSubmissionsView,
  );
  const initialData = await listContactSubmissions({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "createdAt:desc",
    topic: "",
    rating: "",
  });

  return (
    <ContactSubmissionsManager
      canEdit={canAccess(user.role, PERMISSIONS.AllContactUsSubmissionsEdit)}
      initialData={initialData}
    />
  );
}
