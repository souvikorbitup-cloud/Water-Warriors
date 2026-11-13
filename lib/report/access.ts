import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

export const REPORT_ACCESS_COOKIE = "ww_report_access";

function getSignature(orderId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured.");

  return createHmac("sha256", secret).update(`report:${orderId}`).digest("hex");
}

export function createReportAccessCookie(orderId: string): string {
  return `${orderId}.${getSignature(orderId)}`;
}

export function attachReportAccessCookie(
  response: NextResponse,
  orderId: string,
): NextResponse {
  response.cookies.set(
    REPORT_ACCESS_COOKIE,
    createReportAccessCookie(orderId),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    },
  );
  return response;
}

export function getOrderIdFromReportCookie(
  token: string | undefined,
): string | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const orderId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  let expected: string;
  try {
    expected = getSignature(orderId);
  } catch (error) {
    console.error("Could not validate report access.", error);
    return null;
  }

  const receivedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    receivedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(receivedBytes, expectedBytes)
  ) {
    return null;
  }

  return orderId;
}
