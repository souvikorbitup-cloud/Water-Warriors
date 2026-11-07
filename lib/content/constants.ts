export const CONTENT_PUBLISH_STATUSES = ["published", "draft"] as const;
export type ContentPublishStatus = (typeof CONTENT_PUBLISH_STATUSES)[number];

export const TEAM_GROUPS = ["leadership", "technical_advisors"] as const;
export type TeamGroup = (typeof TEAM_GROUPS)[number];

export const FAQ_GROUPS = ["contact", "general"] as const;
export type FaqGroup = (typeof FAQ_GROUPS)[number];

export type PublicTestimonial = {
  id: string;
  fullName: string;
  jobRole: string;
  message: string;
  imageUrl: string;
};

export type PublicTeamMember = {
  id: string;
  slug: string;
  group: TeamGroup;
  fullName: string;
  role: string;
  tagline: string;
  description: string;
  avatarUrl: string;
};

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
};

export const CONTENT_SORT_VALUES = [
  "order:asc",
  "order:desc",
  "createdAt:desc",
  "createdAt:asc",
  "updatedAt:desc",
  "updatedAt:asc",
  "fullName:asc",
  "fullName:desc",
] as const;

export type ContentSortValue = (typeof CONTENT_SORT_VALUES)[number];

export const TESTIMONIAL_IMAGE_FOLDER = "testimonials";
export const TEAM_MEMBER_IMAGE_FOLDER = "team";
