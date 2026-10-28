import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [emailOTPClient()],
});

export const { signIn, signOut, useSession } = authClient;

/**
 * Client-side session user type, including the custom fields we mirrored
 * onto the Better Auth user record. Keep in sync with src/lib/auth.ts
 * user.additionalFields.
 */
export type SessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePublicId?: string | null;
  role: string;
  isProfileComplete: boolean;
};
