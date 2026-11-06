import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseListQuery } from "@/lib/submissions/query";
import { listContactSubmissions } from "@/lib/submissions/contact-service";

export const GET = withAuth(
  async (req: NextRequest) => {
    const query = parseListQuery(req.nextUrl.searchParams);
    const result = await listContactSubmissions(query);
    return NextResponse.json(result);
  },
  { permission: PERMISSIONS.AllContactUsSubmissionsView },
);
