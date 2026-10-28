import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { isAppearanceSettings } from "@/lib/appearance/settings";
import {
  getAppearanceSettings,
  saveAppearanceSettings,
} from "@/lib/services/appearance-settings";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const settings = await getAppearanceSettings();
  return NextResponse.json(settings, { headers: noStoreHeaders });
}

export const PUT = withAuth(
  async (request: NextRequest) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    if (!isAppearanceSettings(body)) {
      return NextResponse.json(
        { message: "Provide valid colors and supported Google Fonts." },
        { status: 400 },
      );
    }

    await saveAppearanceSettings(body);
    return NextResponse.json(body, { headers: noStoreHeaders });
  },
  { permission: PERMISSIONS.appearanceManage },
);
