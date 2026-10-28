import type { Metadata } from "next";
import { Suspense } from "react";
import Loding from "@/components/main/shared/loading/Loding";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAppearanceSettings } from "@/lib/services/appearance-settings";
import AppearanceSettingsForm from "./settings-form";

export const metadata: Metadata = {
  title: "Brand Appearance",
};

export default function AppearancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loding />
        </div>
      }
    >
      <AppearancePageContent />
    </Suspense>
  );
}

async function AppearancePageContent() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  const settings = await getAppearanceSettings();
  return <AppearanceSettingsForm initialSettings={settings} />;
}
