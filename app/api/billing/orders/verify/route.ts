import { NextRequest, NextResponse } from "next/server";
import {
  getBillingOrder,
  markBillingOrderPaid,
} from "@/lib/billing/billing-service";
import {
  fetchPayment,
  RazorpayError,
  verifyOrderPaymentSignature,
} from "@/lib/razorpay/razorpay.service";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid payment verification request." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("razorpay_order_id" in body) ||
    !("razorpay_payment_id" in body) ||
    !("razorpay_signature" in body) ||
    typeof body.razorpay_order_id !== "string" ||
    typeof body.razorpay_payment_id !== "string" ||
    typeof body.razorpay_signature !== "string"
  ) {
    return NextResponse.json(
      { message: "Invalid payment verification request." },
      { status: 400 },
    );
  }

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId } = body;

  try {
    const order = await getBillingOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { message: "Payment order not found." },
        { status: 404 },
      );
    }

    if (
      !verifyOrderPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: body.razorpay_signature,
      })
    ) {
      return NextResponse.json(
        { message: "Payment could not be verified." },
        { status: 400 },
      );
    }

    if (order.status === "paid" && order.paymentId === paymentId) {
      return NextResponse.json({ success: true });
    }

    const payment = await fetchPayment(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amountPaise ||
      payment.currency !== order.currency ||
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        { message: "Payment is not captured yet. Please try again shortly." },
        { status: 409 },
      );
    }

    await markBillingOrderPaid(orderId, paymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RazorpayError) {
      console.error("Payment verification request failed:", error.message);
      return NextResponse.json(
        { message: "Could not verify payment. Please contact support." },
        { status: error.isConfig ? 503 : 502 },
      );
    }

    console.error("Could not verify the billing order:", error);
    return NextResponse.json(
      { message: "Could not verify payment. Please contact support." },
      { status: 500 },
    );
  }
}
