import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getBillingQuote,
  InvalidCouponError,
  saveBillingOrder,
} from "@/lib/billing/billing-service";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  RazorpayError,
} from "@/lib/razorpay/razorpay.service";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid checkout request." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid checkout request." },
      { status: 400 },
    );
  }

  const couponCode =
    "couponCode" in body && typeof body.couponCode === "string"
      ? body.couponCode.trim()
      : "";
  const customerName =
    "customerName" in body && typeof body.customerName === "string"
      ? body.customerName.trim().slice(0, 100)
      : "";

  try {
    const quote = await getBillingQuote(couponCode);
    const keyId = getRazorpayKeyId();
    const order = await createRazorpayOrder({
      amountPaise: quote.totalPaise,
      currency: quote.currency,
      receipt: `plus-${randomUUID().replace(/-/g, "").slice(0, 32)}`,
      notes: {
        plan: "Plus",
        ...(quote.couponCode ? { coupon_code: quote.couponCode } : {}),
        ...(customerName ? { customer_name: customerName } : {}),
      },
    });

    await saveBillingOrder({
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      couponCode: quote.couponCode,
      customerName,
      status: "created",
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        customerName,
        description: "Water Warriors Plus report",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof InvalidCouponError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof RazorpayError) {
      console.error("Could not create the Razorpay order:", error.message);
      return NextResponse.json(
        {
          message: error.isConfig
            ? "Payment service is not configured."
            : "Could not start payment. Please try again.",
        },
        { status: error.isConfig ? 503 : 502 },
      );
    }

    console.error("Could not create the billing order:", error);
    return NextResponse.json(
      { message: "Could not start payment. Please try again." },
      { status: 500 },
    );
  }
}
