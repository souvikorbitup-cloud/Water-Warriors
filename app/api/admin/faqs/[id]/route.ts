import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db";
import Faq, { type IFaq } from "@/lib/models/Faq.model";
import { faqUpdateSchema } from "@/lib/content/schemas";
import { toFaqDetail } from "@/lib/content/query";
import {
  duplicateKeyMessage,
  invalidBodyResponse,
  invalidIdResponse,
  isValidObjectId,
  mongooseValidationMessage,
  notFoundResponse,
  noStoreHeaders,
  omitUndefined,
  zodFailure,
} from "@/lib/content/http";

export const GET = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await Faq.findById(id).lean<IFaq & { _id: unknown }>();
    if (!doc) return notFoundResponse("FAQ");

    return NextResponse.json(
      { item: toFaqDetail(doc) },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.AllFaqsView },
);

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return invalidBodyResponse();
    }

    const parsed = faqUpdateSchema.safeParse(body);
    if (!parsed.success) return zodFailure(parsed.error);

    await connectDB();
    const doc = await Faq.findById(id);
    if (!doc) return notFoundResponse("FAQ");

    try {
      Object.assign(doc, omitUndefined(parsed.data));
      doc.updatedBy = getAuthUserId(user.id);
      await doc.save();
    } catch (error) {
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to update FAQ:", error);
      return NextResponse.json(
        { message: "Could not update FAQ." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      item: toFaqDetail(doc),
    });
  },
  { permission: PERMISSIONS.AllFaqsEdit },
);

export const DELETE = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await Faq.findById(id);
    if (!doc) return notFoundResponse("FAQ");

    await doc.softDelete();
    return NextResponse.json({ success: true });
  },
  { permission: PERMISSIONS.AllFaqsEdit },
);
