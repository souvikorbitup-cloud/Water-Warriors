import type { SortOrder } from "mongoose";
import { routing } from "@/i18n/routing";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import type {
  ITestimonial,
  TestimonialTranslations,
} from "@/lib/models/Testimonial.model";
import type {
  ITeamMember,
  TeamMemberTranslations,
} from "@/lib/models/Teammember.model";
import type { FaqTranslations, IFaq } from "@/lib/models/Faq.model";
import {
  FAQ_GROUPS,
  TEAM_GROUPS,
  type FaqGroup,
  type TeamGroup,
} from "./constants";
import {
  buildSearchFilter,
  previewText,
  serializeId,
  toIsoDate,
} from "@/lib/submissions/query";
import type {
  ContentListResponse,
  FaqDetail,
  FaqListItem,
  TeamMemberDetail,
  TeamMemberListItem,
  TestimonialDetail,
  TestimonialListItem,
} from "../../types/content";
import { contentListQuerySchema, type ContentListQueryInput } from "./schemas";
import { type ContentSortValue } from "./constants";

const defaultLocale = routing.defaultLocale;

export function parseContentListQuery(
  searchParams: URLSearchParams,
): ContentListQueryInput {
  const parsed = contentListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    sort: searchParams.get("sort") ?? undefined,
    group: searchParams.get("group") ?? "",
  });

  if (!parsed.success) {
    return {
      page: 1,
      limit: 10,
      search: "",
      status: "",
      sort: "order:asc",
      group: "",
    };
  }

  return parsed.data;
}

export function toContentMongoSort(
  sort: ContentSortValue,
): Record<string, SortOrder> {
  const [field, direction] = sort.split(":") as [string, "asc" | "desc"];
  return { [field]: direction === "asc" ? 1 : -1 };
}

export function buildPublishedFilter(status: string): Record<string, unknown> {
  if (status === "published") return { isPublished: true };
  if (status === "draft") return { isPublished: false };
  return {};
}

export function buildTestimonialFilter(
  query: ContentListQueryInput,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    ...buildPublishedFilter(query.status),
  };

  const searchFields = [
    "fullName",
    ...routing.locales.flatMap((locale) => [
      `translations.${locale}.jobRole`,
      `translations.${locale}.message`,
    ]),
  ];

  return { ...filter, ...buildSearchFilter(query.search, searchFields) };
}

export function buildTeamMemberFilter(
  query: ContentListQueryInput,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    ...buildPublishedFilter(query.status),
  };

  if (query.group && (TEAM_GROUPS as readonly string[]).includes(query.group)) {
    filter.group = query.group;
  }

  const searchFields = [
    "fullName",
    "slug",
    ...routing.locales.flatMap((locale) => [
      `translations.${locale}.role`,
      `translations.${locale}.tagline`,
      `translations.${locale}.description`,
    ]),
  ];

  return { ...filter, ...buildSearchFilter(query.search, searchFields) };
}

export function buildFaqFilter(
  query: ContentListQueryInput,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    ...buildPublishedFilter(query.status),
  };

  if (query.group && (FAQ_GROUPS as readonly string[]).includes(query.group)) {
    filter.group = query.group;
  }

  const searchFields = routing.locales.flatMap((locale) => [
    `translations.${locale}.question`,
    `translations.${locale}.answer`,
  ]);

  return { ...filter, ...buildSearchFilter(query.search, searchFields) };
}

export function toTestimonialListItem(
  doc: ITestimonial & { _id: unknown },
): TestimonialListItem {
  const translation = doc.translations?.[defaultLocale];
  return {
    id: serializeId(doc._id),
    fullName: doc.fullName,
    jobRole: translation?.jobRole ?? "",
    preview: previewText(translation?.message ?? ""),
    imageUrl: doc.imagePublicId ? getCloudinaryUrl(doc.imagePublicId) : "",
    imagePublicId: doc.imagePublicId ?? null,
    order: doc.order,
    isPublished: doc.isPublished,
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function toTestimonialDetail(
  doc: ITestimonial & { _id: unknown },
): TestimonialDetail {
  return {
    ...toTestimonialListItem(doc),
    translations: doc.translations as TestimonialTranslations,
  };
}

export function toTeamMemberListItem(
  doc: ITeamMember & { _id: unknown },
): TeamMemberListItem {
  const translation = doc.translations?.[defaultLocale];
  return {
    id: serializeId(doc._id),
    slug: doc.slug,
    group: doc.group,
    fullName: doc.fullName,
    role: translation?.role ?? "",
    tagline: translation?.tagline ?? "",
    preview: previewText(translation?.description ?? ""),
    avatarUrl: doc.avatarPublicId ? getCloudinaryUrl(doc.avatarPublicId) : "",
    avatarPublicId: doc.avatarPublicId ?? null,
    order: doc.order,
    isPublished: doc.isPublished,
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function toTeamMemberDetail(
  doc: ITeamMember & { _id: unknown },
): TeamMemberDetail {
  return {
    ...toTeamMemberListItem(doc),
    translations: doc.translations as TeamMemberTranslations,
  };
}

export function toFaqListItem(doc: IFaq & { _id: unknown }): FaqListItem {
  const translation = doc.translations?.[defaultLocale];
  return {
    id: serializeId(doc._id),
    group: doc.group,
    question: translation?.question ?? "",
    preview: previewText(translation?.answer ?? ""),
    order: doc.order,
    isPublished: doc.isPublished,
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function toFaqDetail(doc: IFaq & { _id: unknown }): FaqDetail {
  return {
    ...toFaqListItem(doc),
    translations: doc.translations as FaqTranslations,
  };
}

export function paginateMeta(
  page: number,
  limit: number,
  total: number,
): Pick<
  ContentListResponse<unknown>,
  "page" | "limit" | "total" | "totalPages"
> {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function isTeamGroup(value: string): value is TeamGroup {
  return (TEAM_GROUPS as readonly string[]).includes(value);
}

export function isFaqGroup(value: string): value is FaqGroup {
  return (FAQ_GROUPS as readonly string[]).includes(value);
}
