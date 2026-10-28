import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function ContactUsSubmissionsPage() {
  const user = await requirePagePermission(
    PERMISSIONS.AllContactUsSubmissionsView,
  );

  return <UnderConstruction pageName="Contact Us Submissions Page" />;
}
