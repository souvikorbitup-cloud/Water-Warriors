import type { TeamGroup, FaqGroup } from "@/lib/content/constants";
import type {
  ITestimonialTranslation,
  TestimonialTranslations,
} from "@/lib/models/Testimonial.model";
import type {
  ITeamMemberTranslation,
  TeamMemberTranslations,
} from "@/lib/models/Teammember.model";
import type { IFaqTranslation, FaqTranslations } from "@/lib/models/Faq.model";

export type ContentListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TestimonialListItem = {
  id: string;
  fullName: string;
  jobRole: string;
  preview: string;
  imageUrl: string;
  imagePublicId: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TestimonialDetail = TestimonialListItem & {
  translations: TestimonialTranslations;
};

export type TeamMemberListItem = {
  id: string;
  slug: string;
  group: TeamGroup;
  fullName: string;
  role: string;
  tagline: string;
  preview: string;
  avatarUrl: string;
  avatarPublicId: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberDetail = TeamMemberListItem & {
  translations: TeamMemberTranslations;
};

export type FaqListItem = {
  id: string;
  group: FaqGroup;
  question: string;
  preview: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FaqDetail = FaqListItem & {
  translations: FaqTranslations;
};

export type {
  ITestimonialTranslation,
  ITeamMemberTranslation,
  IFaqTranslation,
};
