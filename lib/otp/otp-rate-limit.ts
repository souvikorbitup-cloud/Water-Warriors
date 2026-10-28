import { connectDB } from "../db";
import mongoose from "mongoose";

const SEND_WINDOW_MS = 60 * 1000; // 1 minute
const SEND_MAX_PER_HOUR = 5; // hard cap per email per hour

const VERIFY_MAX_ATTEMPTS = 5; // wrong-code attempts allowed per OTP cycle
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000; // lock this email out for 15 min after exceeding attempts

interface RateLimitDoc {
  _id: string; // `${purpose}:${email}`
  sendTimestamps: number[];
  verifyAttempts: number;
  lockedUntil: number | null;
  updatedAt: Date;
}

async function getCollection() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongoose connection not ready");
  return db.collection<RateLimitDoc>("otp_rate_limits");
}

function key(purpose: string, email: string) {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: "cooldown" | "hourly-cap" | "locked";
}

/** Call before sending a new OTP. */
export async function checkAndRecordOTPSend(
  purpose: string,
  email: string,
): Promise<RateLimitResult> {
  const col = await getCollection();
  const id = key(purpose, email);
  const now = Date.now();

  const doc = await col.findOne({ _id: id });

  if (doc?.lockedUntil && doc.lockedUntil > now) {
    return {
      allowed: false,
      reason: "locked",
      retryAfterSeconds: Math.ceil((doc.lockedUntil - now) / 1000),
    };
  }

  const recentSends = (doc?.sendTimestamps ?? []).filter(
    (t) => now - t < 60 * 60 * 1000,
  );

  const lastSend = recentSends[recentSends.length - 1];
  if (lastSend && now - lastSend < SEND_WINDOW_MS) {
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: Math.ceil((SEND_WINDOW_MS - (now - lastSend)) / 1000),
    };
  }

  if (recentSends.length >= SEND_MAX_PER_HOUR) {
    const oldestInWindow = recentSends[0];
    return {
      allowed: false,
      reason: "hourly-cap",
      retryAfterSeconds: Math.ceil(
        (oldestInWindow + 60 * 60 * 1000 - now) / 1000,
      ),
    };
  }

  await col.updateOne(
    { _id: id },
    {
      $set: {
        sendTimestamps: [...recentSends, now],
        verifyAttempts: 0, // fresh OTP cycle resets verify attempts
        lockedUntil: null,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { allowed: true };
}

/** Call before checking a submitted OTP against the stored one. */
export async function checkVerifyAllowed(
  purpose: string,
  email: string,
): Promise<RateLimitResult> {
  const col = await getCollection();
  const id = key(purpose, email);
  const now = Date.now();

  const doc = await col.findOne({ _id: id });

  if (doc?.lockedUntil && doc.lockedUntil > now) {
    return {
      allowed: false,
      reason: "locked",
      retryAfterSeconds: Math.ceil((doc.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true };
}

/** Call after a FAILED verification attempt. Locks out the email after too many failures. */
export async function recordFailedVerifyAttempt(
  purpose: string,
  email: string,
): Promise<void> {
  const col = await getCollection();
  const id = key(purpose, email);
  const now = Date.now();

  const doc = await col.findOne({ _id: id });
  const attempts = (doc?.verifyAttempts ?? 0) + 1;

  const update: Partial<RateLimitDoc> = {
    verifyAttempts: attempts,
    updatedAt: new Date(),
  };

  if (attempts >= VERIFY_MAX_ATTEMPTS) {
    update.lockedUntil = now + VERIFY_LOCKOUT_MS;
  }

  await col.updateOne({ _id: id }, { $set: update }, { upsert: true });
}

/** Call after a SUCCESSFUL verification to clear counters. */
export async function clearRateLimit(
  purpose: string,
  email: string,
): Promise<void> {
  const col = await getCollection();
  await col.deleteOne({ _id: key(purpose, email) });
}
