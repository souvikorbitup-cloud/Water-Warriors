import type { Metadata } from "next";
import { Suspense } from "react";
import BillingOrdersManager from "@/components/admin/sections/billing/BillingOrdersManager";
import SubmissionsPageSkeleton from "@/components/admin/sections/submissions/SubmissionsPageSkeleton";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { listBillingOrders } from "@/lib/billing/billing-service";

export const metadata: Metadata = {
  title: "Orders Billings",
};

export default function BillingOrdersPage() {
  return (
    <Suspense
      fallback={<SubmissionsPageSkeleton title="Orders Billings" columns={6} />}
    >
      <BillingOrdersContent />
    </Suspense>
  );
}

async function BillingOrdersContent() {
  await requirePagePermission(PERMISSIONS.paymentsView);
  const initialData = await listBillingOrders({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sort: "createdAt:desc",
  });

  return <BillingOrdersManager initialData={initialData} />;
}
