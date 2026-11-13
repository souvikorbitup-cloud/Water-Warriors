import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  BillingValidationError,
  createCoupon,
  getPlusPlanPricePaise,
  listCoupons,
  savePlusPlanPricePaise,
} from "@/lib/billing/billing-service";
import { couponInputSchema, planPriceSchema } from "@/lib/billing/schemas";
import {
  duplicateKeyMessage,
  noStoreHeaders,
  zodFailure,
} from "@/lib/content/http";

export const GET = withAuth(
  async () => {
    const [pricePaise, coupons] = await Promise.all([
      getPlusPlanPricePaise(),
      listCoupons(),
    ]);

    return NextResponse.json(
      { pricePaise, coupons },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.paymentsView },
);

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

    const parsed = planPriceSchema.safeParse(body);
    if (!parsed.success) return zodFailure(parsed.error);

    try {
      await savePlusPlanPricePaise(parsed.data.pricePaise);
      return NextResponse.json(
        { pricePaise: parsed.data.pricePaise },
        { headers: noStoreHeaders },
      );
    } catch (error) {
      const isValidationError = error instanceof BillingValidationError;
      if (!isValidationError) {
        console.error("Could not save the Plus plan price:", error);
      }
      return NextResponse.json(
        {
          message: isValidationError
            ? error.message
            : "Could not save the Plus plan price.",
        },
        { status: isValidationError ? 400 : 500 },
      );
    }
  },
  { permission: PERMISSIONS.paymentsView },
);

export const POST = withAuth(
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

    const parsed = couponInputSchema.safeParse(body);
    if (!parsed.success) return zodFailure(parsed.error);

    try {
      await createCoupon(parsed.data);
      return NextResponse.json({ success: true }, { status: 201 });
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
        console.error("Could not create the coupon:", error);
      return NextResponse.json(
        {
          message: isValidationError
            ? error.message
            : "Could not create the coupon.",
        },
        { status: isValidationError ? 400 : 500 },
      );
    }
  },
  { permission: PERMISSIONS.paymentsView },
);
