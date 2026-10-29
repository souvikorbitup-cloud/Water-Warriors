import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";
import HeroBannerForm from "./settings-form";

export const metadata: Metadata = {
  title: "Hero Banner",
};

export default async function HeroBannerPage() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  const settings = await getHeroBannerSettings();

  return <HeroBannerForm initialSettings={settings} />;
}
