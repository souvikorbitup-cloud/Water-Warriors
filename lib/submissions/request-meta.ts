import { createHash } from "crypto";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "0.0.0.0";
}

export function hashClientIp(req: NextRequest): string {
  const salt =
    process.env.IP_HASH_SALT ||
    process.env.BETTER_AUTH_SECRET ||
    "water-warriors";
  return createHash("sha256")
    .update(`${getClientIp(req)}:${salt}`)
    .digest("hex");
}

export function getUserAgent(req: NextRequest): string | undefined {
  const userAgent = req.headers.get("user-agent")?.trim();
  if (!userAgent) return undefined;
  return userAgent.slice(0, 512);
}

export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };
