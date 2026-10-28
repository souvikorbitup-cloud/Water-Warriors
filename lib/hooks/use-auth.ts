"use client";

import { useSession, type SessionUser } from "@/lib/auth/auth-client";
import { canAccess, type Permission } from "@/lib/auth/permissions";
import { isValidRole } from "@/lib/auth/roles";

export function useCurrentUser(): {
  user: SessionUser | null;
  isPending: boolean;
  refetch: () => Promise<void>;
} {
  const { data, isPending, refetch } = useSession();
  return {
    user: (data?.user as SessionUser | undefined) ?? null,
    isPending,
    refetch,
  };
}

export function useIsAuthenticated(): boolean {
  const { data } = useSession();
  return !!data?.user;
}

export function useHasPermission(permission?: Permission): boolean {
  const { data } = useSession();
  if (!data?.user || !permission) return false;

  const role = (data.user as unknown as SessionUser).role;
  return isValidRole(role) && canAccess(role, permission);
}

export function useHasAnyPermission(
  permissions: readonly Permission[],
): boolean {
  const { data } = useSession();
  if (!data?.user) return false;

  const role = (data.user as unknown as SessionUser).role;
  return (
    isValidRole(role) &&
    permissions.some((permission) => canAccess(role, permission))
  );
}
