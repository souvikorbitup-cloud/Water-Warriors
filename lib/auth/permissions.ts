import { ROLES, type Role } from "./roles";

export const PERMISSIONS = {
  // Menu
  dashboardView: "dashboard:view",
  profileView: "profile:view",
  profileEdit: "profile:edit",
  appearanceManage: "appearance:manage",
  // Content
  // Submission
  AllContactUsSubmissionsView: "allContactUsSubmissions:view",
  AllContactUsSubmissionsEdit: "allContactUsSubmissions:Edit",
  // Payments
  paymentsView: "payments:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    // Menu
    PERMISSIONS.dashboardView,
    PERMISSIONS.profileView,
    PERMISSIONS.profileEdit,
    PERMISSIONS.appearanceManage,
    // Content
    // Submission
    PERMISSIONS.AllContactUsSubmissionsView,
    PERMISSIONS.AllContactUsSubmissionsEdit,
    // Payments
    PERMISSIONS.paymentsView,
  ],
  user: [
    // Menu
    PERMISSIONS.profileView,
    PERMISSIONS.profileEdit,
  ],
};

export function canAccess(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolesForPermission(permission: Permission): readonly Role[] {
  return ROLES.filter((role) => canAccess(role, permission));
}
