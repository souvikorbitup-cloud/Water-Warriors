import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function ContactUsSubmissionsPage() {
  await requirePagePermission(PERMISSIONS.AllContactUsSubmissionsView);

  return (
    <UnderConstructionAdmin
      pageName="Contact Us Submissions Page"
      classes="min-h-[80dvh]"
    />
  );
}
