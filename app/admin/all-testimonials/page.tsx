import UnderConstructionAdmin from "@/components/main/shared/UnderConstructionAdmin";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AllTestimonialsPage() {
  await requirePagePermission(PERMISSIONS.AllTestimonialsView);

  return (
    <UnderConstructionAdmin
      pageName="All Testimonials Page"
      classes="min-h-[80dvh]"
    />
  );
}
