import { ROLES, type Role } from "./roles";

export const PERMISSIONS = {
  // Menu
  dashboardView: "dashboard:view",
  profileView: "profile:view",
  profileEdit: "profile:edit",
  appearanceManage: "appearance:manage",
  // Manage
  AllTeamMembersView: "allTeamMembers:view",
  AllTeamMembersEdit: "allTeamMembers:edit",
  AllTestimonialsView: "allTestimonials:view",
  AllTestimonialsEdit: "allTestimonials:edit",
  // Content
  AllDIYGuidesView: "allDIYGuides:view",
  AllFaqsView: "allFaqs:view",
  AllFaqsEdit: "allFaqs:edit",
  // Submission
  AllContactUsSubmissionsView: "allContactUsSubmissions:view",
  AllContactUsSubmissionsEdit: "allContactUsSubmissions:edit",
  AllFeedbackSubmissionsView: "allFeedbackSubmissions:view",
  AllFeedbackSubmissionsEdit: "allFeedbackSubmissions:edit",
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
    PERMISSIONS.AllTeamMembersEdit,
    PERMISSIONS.AllTestimonialsView,
    PERMISSIONS.AllTestimonialsEdit,
    // Content
    PERMISSIONS.AllDIYGuidesView,
    PERMISSIONS.AllFaqsView,
    PERMISSIONS.AllFaqsEdit,
    // Submission
    PERMISSIONS.AllContactUsSubmissionsView,
    PERMISSIONS.AllContactUsSubmissionsEdit,
    PERMISSIONS.AllFeedbackSubmissionsView,
    PERMISSIONS.AllFeedbackSubmissionsEdit,
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
