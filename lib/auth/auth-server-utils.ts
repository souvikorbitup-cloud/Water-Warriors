import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { canAccess, type Permission } from "./permissions";
import type { Role } from "./roles";

/**
 * All server-side authorization. NEVER trust a client-supplied role — this
 * always re-derives the role from the verified, server-side session.
 */

export type ServerSessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePublicId?: string | null;
  role: Role;
  isProfileComplete: boolean;
};

/**
 * Fetches and verifies the current session server-side (Server Component,
 * Route Handler, or Server Action). Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<ServerSessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return session.user as unknown as ServerSessionUser;
}

/**
 * Requires a signed-in user with a completed profile for a page.
 */
export async function requirePageAuth(): Promise<ServerSessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isProfileComplete) {
    redirect("/sign-in?redirect=/admin/profile");
  }

  return user;
}

export async function requirePagePermission(
  permission: Permission,
): Promise<ServerSessionUser> {
  const user = await requirePageAuth();

  if (!canAccess(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

export async function hasAnyRole(roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Throws if there is no authenticated session. Use at the top of Server
 * Actions / Route Handlers / Server Components that require auth.
 */
export async function requireAuth(): Promise<ServerSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "You must be signed in.", 401);
  }
  return user;
}

/**
 * Throws unless the current user has the exact role.
 */
export async function requireRole(role: Role): Promise<ServerSessionUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new AuthError(
      "FORBIDDEN",
      "You do not have permission to do this.",
      403,
    );
  }
  return user;
}

/**
 * Throws unless the current user has one of the given roles.
 */
export async function requireAnyRole(
  roles: Role[],
): Promise<ServerSessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError(
      "FORBIDDEN",
      "You do not have permission to do this.",
      403,
    );
  }
  return user;
}

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  status: number;

  constructor(
    code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
    status: number,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AuthError";
  }
}
