import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  BillingValidationError,
  deleteCoupon,
  updateCoupon,
} from "@/lib/billing/billing-service";
import { couponInputSchema } from "@/lib/billing/schemas";
import { duplicateKeyMessage, zodFailure } from "@/lib/content/http";

export const PUT = withAuth(
  async (request: NextRequest, { params }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = couponInputSchema.safeParse(body);
    if (!parsed.success) return zodFailure(parsed.error);

    const { code } = await params;
    try {
      const updated = await updateCoupon(code, parsed.data);
      if (!updated) {
        return NextResponse.json(
          { message: "Coupon not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json(
          { message: "That coupon code already exists." },
          { status: 409 },
        );
      }

      const isValidationError = error instanceof BillingValidationError;
      if (!isValidationError)
        console.error("Could not update the coupon:", error);
      return NextResponse.json(
        {
          message: isValidationError
            ? error.message
            : "Could not update the coupon.",
        },
        { status: isValidationError ? 400 : 500 },
      );
    }
  },
  { permission: PERMISSIONS.paymentsView },
);

export const DELETE = withAuth(
  async (_request: NextRequest, { params }) => {
    const { code } = await params;
    try {
      const deleted = await deleteCoupon(code);
      if (!deleted) {
        return NextResponse.json(
          { message: "Coupon not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Could not delete the coupon:", error);
      return NextResponse.json(
        { message: "Could not delete the coupon." },
        { status: 500 },
      );
    }
  },
  { permission: PERMISSIONS.paymentsView },
);
