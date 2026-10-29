import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAppearanceSettings } from "@/lib/services/appearance-settings";
import AppearanceSettingsForm from "./settings-form";

export const metadata: Metadata = {
  title: "Brand Appearance",
};

export default function AppearancePage() {
  return (
    <Suspense fallback={<AppearancePageSkeleton />}>
      <AppearancePageContent />
    </Suspense>
  );
}

async function AppearancePageContent() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  const settings = await getAppearanceSettings();
  return <AppearanceSettingsForm initialSettings={settings} />;
}

function AppearancePageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading appearance settings"
      className="space-y-6"
    >
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-14 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end" aria-hidden="true">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
