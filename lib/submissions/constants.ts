export const CONTACT_STATUSES = [
  "new",
  "read",
  "replied",
  "spam",
  "archived",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_REASONS = ["question", "support", "partnership"] as const;
export type ContactReason = (typeof CONTACT_REASONS)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "spam",
  "archived",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
