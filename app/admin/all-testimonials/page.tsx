import UnderConstruction from "@/components/main/shared/UnderConstruction";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AllTestimonialsPage() {
  await requirePagePermission(PERMISSIONS.AllTestimonialsView);

  return (
    <UnderConstruction
      pageName="All Testimonials Page"
      classes="min-h-[80dvh]"
    />
  );
}
