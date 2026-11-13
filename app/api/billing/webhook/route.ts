import { NextRequest, NextResponse } from "next/server";
import {
  getBillingOrder,
  markBillingOrderPaid,
} from "@/lib/billing/billing-service";
import {
  RazorpayError,
  verifyWebhookSignature,
  type RazorpayWebhookPayload,
} from "@/lib/razorpay/razorpay.service";
import { ensurePaidReportSession } from "@/lib/report/report-session-service";

function isCapturedPaymentPayload(
  value: unknown,
): value is RazorpayWebhookPayload {
  if (typeof value !== "object" || value === null || !("event" in value)) {
    return false;
  }
  if (value.event !== "payment.captured" && value.event !== "order.paid") {
    return false;
  }
  if (
    !("payload" in value) ||
    typeof value.payload !== "object" ||
    value.payload === null ||
    !("payment" in value.payload) ||
    typeof value.payload.payment !== "object" ||
    value.payload.payment === null ||
    !("entity" in value.payload.payment) ||
    typeof value.payload.payment.entity !== "object" ||
    value.payload.payment.entity === null
  ) {
    return false;
  }

  const payment = value.payload.payment.entity;
  return (
    "id" in payment &&
    typeof payment.id === "string" &&
    "order_id" in payment &&
    typeof payment.order_id === "string" &&
    "amount" in payment &&
    typeof payment.amount === "number" &&
    "currency" in payment &&
    typeof payment.currency === "string" &&
    "status" in payment &&
    payment.status === "captured"
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  try {
    if (
      !verifyWebhookSignature(
        rawBody,
        request.headers.get("x-razorpay-signature"),
      )
    ) {
      return NextResponse.json(
        { message: "Invalid payment webhook signature." },
        { status: 400 },
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { message: "Invalid payment webhook payload." },
        { status: 400 },
      );
    }

    if (
      typeof payload === "object" &&
      payload !== null &&
      "event" in payload &&
      payload.event !== "payment.captured" &&
      payload.event !== "order.paid"
    ) {
      return NextResponse.json({ received: true });
    }
    if (!isCapturedPaymentPayload(payload)) {
      return NextResponse.json(
        { message: "Invalid captured-payment webhook payload." },
        { status: 400 },
      );
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      return NextResponse.json(
        { message: "Webhook is missing its order reference." },
        { status: 400 },
      );
    }
    const order = await getBillingOrder(payment.order_id);
    if (!order) {
      return NextResponse.json(
        { message: "Payment order not found." },
        { status: 404 },
      );
    }
    if (
      payment.amount !== order.amountPaise ||
      payment.currency !== order.currency
    ) {
      return NextResponse.json(
        { message: "Captured payment does not match the stored order." },
        { status: 409 },
      );
    }

    await markBillingOrderPaid(order.orderId, payment.id);
    await ensurePaidReportSession(order.orderId, payment.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof RazorpayError) {
      console.error("Could not verify the Razorpay webhook:", error.message);
      return NextResponse.json(
        { message: "Could not verify the payment webhook." },
        { status: error.isConfig ? 503 : 502 },
      );
    }
    console.error("Could not process the Razorpay payment webhook:", error);
    return NextResponse.json(
      { message: "Could not process the payment webhook." },
      { status: 500 },
    );
  }
}
