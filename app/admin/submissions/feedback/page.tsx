import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function FeedbackSubmissionsPage() {
  await requirePagePermission(PERMISSIONS.AllFeedbackSubmissionsView);

  return (
    <UnderConstruction
      pageName="Feedback Submissions Page"
      classes="min-h-[80dvh]"
    />
  );
}
