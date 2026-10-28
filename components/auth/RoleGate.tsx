"use client";

import type { ReactNode } from "react";
import {
  useHasAnyPermission,
  useHasPermission,
  useIsAuthenticated,
} from "@/lib/hooks/use-auth";
import type { Permission } from "@/lib/auth/permissions";

interface PermissionGateProps {
  permission?: Permission;
  permissions?: readonly Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * UI-only convenience for hiding/showing elements based on permission.
 */
export function RoleGate({
  permission,
  permissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  const isAuthed = useIsAuthenticated();
  const hasSinglePermission = useHasPermission(permission);
  const hasAnyPermission = useHasAnyPermission(permissions ?? []);
  const hasPermission = permission
    ? hasSinglePermission
    : permissions
      ? hasAnyPermission
      : true;

  if (!isAuthed) return <>{fallback}</>;
  if (!hasPermission) return <>{fallback}</>;

  return <>{children}</>;
}
