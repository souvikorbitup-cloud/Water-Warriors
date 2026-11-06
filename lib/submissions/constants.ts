export const CONTACT_STATUSES = [
  "new",
  "read",
  "replied",
  "spam",
  "archived",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const FEEDBACK_TOPICS = [
  "property",
  "report",
  "general",
  "other",
] as const;
export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "spam",
  "archived",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
