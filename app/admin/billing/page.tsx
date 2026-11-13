import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getPlusPlanPricePaise,
  listCoupons,
} from "@/lib/billing/billing-service";
import BillingManager from "@/components/admin/sections/billing/BillingManager";

export const metadata: Metadata = {
  title: "Plans & Coupons",
};

export default async function BillingPage() {
  await requirePagePermission(PERMISSIONS.paymentsView);
  const [pricePaise, coupons] = await Promise.all([
    getPlusPlanPricePaise(),
    listCoupons(),
  ]);

  return (
    <BillingManager initialPricePaise={pricePaise} initialCoupons={coupons} />
  );
}
