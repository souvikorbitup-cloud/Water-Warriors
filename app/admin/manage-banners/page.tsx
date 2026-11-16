import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAllPageBanners } from "@/lib/services/page-banner-settings";
import ManageBannersForm from "./manage-banners-form";

export const metadata: Metadata = { title: "Manage Banners" };

export default function ManageBannersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  return <ManageBannersForm initialBanners={await getAllPageBanners()} />;
}
