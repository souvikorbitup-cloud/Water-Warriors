import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";
import HeroBannerForm from "./settings-form";

export const metadata: Metadata = {
  title: "Hero Banner",
};

export default function HeroBannerPage() {
  return (
    <Suspense fallback={<HeroBannerPageSkeleton />}>
      <HeroBannerContent />
    </Suspense>
  );
}

async function HeroBannerContent() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  const settings = await getHeroBannerSettings();

  return <HeroBannerForm initialSettings={settings} />;
}

function HeroBannerPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading hero banner settings"
      className="space-y-6"
    >
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2" aria-hidden="true">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-4 rounded-xl border p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="flex justify-end" aria-hidden="true">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
