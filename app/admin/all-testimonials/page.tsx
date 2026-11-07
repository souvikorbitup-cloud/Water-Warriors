import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import TestimonialsManager from "@/components/admin/sections/content/TestimonialsManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listTestimonials } from "@/lib/content/testimonial-service";

export const metadata: Metadata = {
  title: "All Testimonials",
};

export default function AllTestimonialsPage() {
  return (
    <Suspense
      fallback={
        <SubmissionsPageSkeleton title="All Testimonials" columns={6} />
      }
    >
      <AllTestimonialsContent />
    </Suspense>
  );
}

async function AllTestimonialsContent() {
  const user = await requirePagePermission(PERMISSIONS.AllTestimonialsView);
  const initialData = await listTestimonials({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "order:asc",
    group: "",
  });

  return (
    <TestimonialsManager
      canEdit={canAccess(user.role, PERMISSIONS.AllTestimonialsEdit)}
      initialData={initialData}
    />
  );
}
