import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getDemoVideoSettings } from "@/lib/services/demo-video-settings";
import DemoVideoForm from "./settings-form";

export const metadata: Metadata = {
  title: "Demo Video",
};

export default async function DemoVideoPage() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  const settings = await getDemoVideoSettings();

  return <DemoVideoForm initialSettings={settings} />;
}
