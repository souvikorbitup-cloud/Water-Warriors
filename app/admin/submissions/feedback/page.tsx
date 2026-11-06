import type { Metadata } from "next";
import { Suspense } from "react";
import { canAccess, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import FeedbackSubmissionsManager from "@/components/admin/sections/submissions/FeedbackSubmissionsManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { listFeedbackSubmissions } from "@/lib/submissions/feedback-service";

export const metadata: Metadata = {
  title: "Feedback Submissions",
};

export default function FeedbackSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <SubmissionsPageSkeleton title="Feedback Submissions" columns={6} />
      }
    >
      <FeedbackSubmissionsContent />
    </Suspense>
  );
}

async function FeedbackSubmissionsContent() {
  const user = await requirePagePermission(
    PERMISSIONS.AllFeedbackSubmissionsView,
  );
  const initialData = await listFeedbackSubmissions({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "createdAt:desc",
    topic: "",
    rating: "",
  });

  return (
    <FeedbackSubmissionsManager
      canEdit={canAccess(user.role, PERMISSIONS.AllFeedbackSubmissionsEdit)}
      initialData={initialData}
    />
  );
}
