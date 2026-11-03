import { ROLES, type Role } from "./roles";

export const PERMISSIONS = {
  // Menu
  dashboardView: "dashboard:view",
  profileView: "profile:view",
  profileEdit: "profile:edit",
  appearanceManage: "appearance:manage",
  // Manage
  AllTeamMembersView: "allTeamMembers:view",
  AllTestimonialsView: "allTestimonials:view",
  // Content
  AllDIYGuidesView: "allDIYGuides:view",
  AllFaqsView: "allFaqs:view",
  // Submission
  AllContactUsSubmissionsView: "allContactUsSubmissions:view",
  AllContactUsSubmissionsEdit: "allContactUsSubmissions:edit",
  AllFeedbackSubmissionsView: "allFeedbackSubmissions:view",
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
    // Manage
    PERMISSIONS.AllTeamMembersView,
    PERMISSIONS.AllTestimonialsView,
    // Content
    PERMISSIONS.AllDIYGuidesView,
    PERMISSIONS.AllFaqsView,
    // Submission
    PERMISSIONS.AllContactUsSubmissionsView,
    PERMISSIONS.AllContactUsSubmissionsEdit,
    PERMISSIONS.AllFeedbackSubmissionsView,
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
