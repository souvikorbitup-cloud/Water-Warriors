import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient, ObjectId } from "mongodb";

import { connectDB } from "../db";
import { sendMail } from "../mail/send-mail";
import { renderOTPEmail } from "../otp/otp-email-templates";
import {
  checkAndRecordOTPSend,
  checkVerifyAllowed,
  recordFailedVerifyAttempt,
  clearRateLimit,
} from "../otp/otp-rate-limit";
import { DEFAULT_ROLE } from "./roles";

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const betterAuthUrl = process.env.BETTER_AUTH_URL;

const cookieDomain = betterAuthUrl
  ? new URL(betterAuthUrl).hostname.replace(/^www\./, "")
  : undefined;

const isDevelopmentOtpBypassEnabled =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_OTP_BYPASS === "true";

declare global {
  // eslint-disable-next-line no-var
  var _betterAuthMongoClient: MongoClient | undefined;
}

const authMongoClient =
  global._betterAuthMongoClient ??
  new MongoClient(process.env.MONGODB_URI as string);
global._betterAuthMongoClient = authMongoClient;

connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB (Mongoose) at boot:", err);
});

export const auth = betterAuth({
  database: mongodbAdapter(authMongoClient.db()),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: trustedOrigins.length ? trustedOrigins : undefined,

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",

    ...(cookieDomain && {
      crossSubDomainCookies: {
        enabled: true,
        domain: cookieDomain,
      },
    }),
  },

  rateLimit: {
    enabled: true,
    window: 60, // seconds
    max: 20, // generic ceiling per IP per route per window
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/verify-email": { window: 60, max: 8 },
      "/sign-in/email-otp": { window: 60, max: 8 },
    },
  },

  emailAndPassword: {
    enabled: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: {
      enabled: false,
    },
  },

  // Server-owned fields mirrored onto the Better Auth `user` document for
  // fast, single-query access to role/name during session reads.
  // input: false => can NEVER be set directly via public API input, only via
  // databaseHooks / server-side code below. This is critical: a client can
  // never self-assign `role: "admin"`.
  user: {
    additionalFields: {
      firstName: { type: "string", required: false, input: false },
      lastName: { type: "string", required: false, input: false },
      mobile: { type: "string", required: false, input: false },
      profilePublicId: { type: "string", required: false, input: false },
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: DEFAULT_ROLE,
      },
      isProfileComplete: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
      // Admin-managed access control. `isActive: false` blocks sign-in;
      // `isDeleted: true` is a soft delete (the document is kept).
      isActive: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: true,
      },
      isDeleted: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Guarantee every user is created with a safe default role,
          // regardless of anything a client attempted to pass.
          return {
            data: {
              ...user,
              role: DEFAULT_ROLE,
              isProfileComplete: false,
              isActive: true,
              isDeleted: false,
            },
          };
        },
      },
    },
    session: {
      create: {
        // Runs for every sign-in path (email OTP included). Throwing aborts
        // session creation, so a blocked or deleted account can never log in.
        before: async (session) => {
          const doc = await getAuthUserCollection().findOne(
            { _id: getAuthUserId(session.userId) },
            { projection: { isActive: 1, isDeleted: 1 } },
          );

          if (doc?.isDeleted === true) {
            throw new APIError("FORBIDDEN", {
              message: "This account no longer exists.",
            });
          }

          if (doc?.isActive === false) {
            throw new APIError("FORBIDDEN", {
              message:
                "Your account has been blocked. Please contact an administrator.",
            });
          }
        },
      },
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      disableSignUp: false,
      generateOTP: () => (isDevelopmentOtpBypassEnabled ? "123456" : undefined),
      async sendVerificationOTP({ email, otp, type }) {
        const result = await checkAndRecordOTPSend(type, email);
        if (!result.allowed) {
          throw new Error(
            result.reason === "locked"
              ? "Too many attempts. Please try again later."
              : "Please wait before requesting another code.",
          );
        }

        if (isDevelopmentOtpBypassEnabled) return;

        const emailType = type === "change-email" ? "email-verification" : type;
        const { subject, html } = renderOTPEmail(emailType, otp);
        await sendMail({ to: email, subject, html });
      },
    }),
    nextCookies(),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const verifyPaths = [
        "/email-otp/verify-email",
        "/sign-in/email-otp",
        "/email-otp/check-verification-otp",
      ];
      if (!verifyPaths.includes(ctx.path)) return;

      const email = (ctx.body as { email?: string } | undefined)?.email;
      if (!email) return;

      const purpose =
        ctx.path === "/sign-in/email-otp" ? "sign-in" : "email-verification";
      const result = await checkVerifyAllowed(purpose, email);
      if (!result.allowed) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Too many incorrect attempts. Please try again later.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const verifyPaths = ["/email-otp/verify-email", "/sign-in/email-otp"];
      if (!verifyPaths.includes(ctx.path)) return;

      const email = (ctx.body as { email?: string } | undefined)?.email;
      if (!email) return;

      const purpose =
        ctx.path === "/sign-in/email-otp" ? "sign-in" : "email-verification";
      if (ctx.context.returned instanceof APIError) {
        await recordFailedVerifyAttempt(purpose, email);
      } else {
        await clearRateLimit(purpose, email);
      }
    }),
  },
});

export type Auth = typeof auth;

/**
 * Exposes the Better Auth user collection for server-owned profile updates.
 * These fields remain `input: false`, so public auth APIs cannot change them.
 */
export function getAuthUserCollection() {
  return authMongoClient.db().collection<AuthUser>("user");
}

/**
 * Better Auth's `session` collection. Used to revoke every session of a user
 * that an admin blocks or deletes, so it takes effect immediately.
 */
export function getAuthSessionCollection() {
  return authMongoClient
    .db()
    .collection<{ userId: ObjectId | string }>("session");
}

export function getAuthUserId(id: string) {
  return new ObjectId(id);
}

export type AuthUser = {
  _id: ObjectId;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePublicId?: string | null;
  role: string;
  isProfileComplete: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
