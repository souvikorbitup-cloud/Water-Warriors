import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function FeedbackSubmissionsPage() {
  await requirePagePermission(PERMISSIONS.AllFeedbackSubmissionsView);

  return (
    <UnderConstructionAdmin
      pageName="Feedback Submissions Page"
      classes="min-h-[80dvh]"
    />
  );
}
