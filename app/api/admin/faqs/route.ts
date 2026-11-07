import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseContentListQuery } from "@/lib/content/query";
import { faqInputSchema } from "@/lib/content/schemas";
import { createFaq, listFaqs } from "@/lib/content/faq-service";
import {
  duplicateKeyMessage,
  invalidBodyResponse,
  mongooseValidationMessage,
  noStoreHeaders,
  zodFailure,
} from "@/lib/content/http";

export const GET = withAuth(
  async (req: NextRequest) => {
    const query = parseContentListQuery(req.nextUrl.searchParams);
    const result = await listFaqs(query);
    return NextResponse.json(result, { headers: noStoreHeaders });
  },
  { permission: PERMISSIONS.AllFaqsView },
);

export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return invalidBodyResponse();
    }

    const parsed = faqInputSchema.safeParse(body);
    if (!parsed.success) return zodFailure(parsed.error);

    try {
      const item = await createFaq(parsed.data, getAuthUserId(user.id));
      return NextResponse.json({ success: true, item }, { status: 201 });
    } catch (error) {
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to create FAQ:", error);
      return NextResponse.json(
        { message: "Could not create FAQ." },
        { status: 500 },
      );
    }
  },
  { permission: PERMISSIONS.AllFaqsEdit },
);
