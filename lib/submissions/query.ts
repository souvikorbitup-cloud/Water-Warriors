import type { SortOrder } from "mongoose";
import type { IContactSubmission } from "@/lib/models/ContactSubmission.model";
import type { IFeedbackSubmission } from "@/lib/models/FeedbackSubmission.model";
import { escapeRegex } from "./sanitize";
import {
  isContactStatus,
  isFeedbackStatus,
  isFeedbackTopic,
  listQuerySchema,
  type ListQueryInput,
  type SortValue,
} from "./schemas";
import type {
  ContactListItem,
  FeedbackListItem,
} from "../../types/submissions";

export function parseListQuery(searchParams: URLSearchParams): ListQueryInput {
  const parsed = listQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    sort: searchParams.get("sort") ?? undefined,
    topic: searchParams.get("topic") ?? "",
    rating: searchParams.get("rating") ?? "",
  });

  if (!parsed.success) {
    return {
      page: 1,
      limit: 10,
      search: "",
      status: "",
      sort: "createdAt:desc",
      topic: "",
      rating: "",
    };
  }

  return parsed.data;
}

export function toMongoSort(sort: SortValue): Record<string, SortOrder> {
  const [field, direction] = sort.split(":") as [string, "asc" | "desc"];
  return { [field]: direction === "asc" ? 1 : -1 };
}

export function buildSearchFilter(
  search: string,
  fields: string[],
): Record<string, unknown> {
  const trimmed = search.trim();
  if (!trimmed) return {};

  const pattern = escapeRegex(trimmed);
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: pattern, $options: "i" },
    })),
  };
}

export function buildContactFilter(
  query: ListQueryInput,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (query.status && isContactStatus(query.status)) {
    filter.status = query.status;
  }

  const searchFilter = buildSearchFilter(query.search, [
    "name",
    "email",
    "message",
  ]);
  return { ...filter, ...searchFilter };
}

export function buildFeedbackFilter(
  query: ListQueryInput,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (query.status && isFeedbackStatus(query.status)) {
    filter.status = query.status;
  }

  if (query.topic && isFeedbackTopic(query.topic)) {
    filter.topic = query.topic;
  }

  if (query.rating) {
    const rating = Number(query.rating);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }
  }

  const searchFilter = buildSearchFilter(query.search, [
    "name",
    "email",
    "message",
  ]);
  return { ...filter, ...searchFilter };
}

export function serializeId(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return String(value ?? "");
}

export function toIsoDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function previewText(message: string, max = 120): string {
  return message.length > max ? `${message.slice(0, max).trimEnd()}…` : message;
}

export function toContactListItem(
  doc: IContactSubmission & { _id: unknown },
): ContactListItem {
  return {
    id: serializeId(doc._id),
    name: doc.name,
    email: doc.email,
    message: doc.message,
    preview: previewText(doc.message),
    status: doc.status,
    adminNote: doc.adminNote ?? "",
    handledBy: doc.handledBy ? serializeId(doc.handledBy) : null,
    readAt: toIsoDate(doc.readAt),
    repliedAt: toIsoDate(doc.repliedAt),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function toFeedbackListItem(
  doc: IFeedbackSubmission & { _id: unknown },
): FeedbackListItem {
  return {
    id: serializeId(doc._id),
    topic: doc.topic,
    rating: doc.rating,
    name: doc.name ?? "",
    email: doc.email ?? "",
    message: doc.message,
    preview: previewText(doc.message),
    isAnonymous: !doc.name && !doc.email,
    status: doc.status,
    adminNote: doc.adminNote ?? "",
    handledBy: doc.handledBy ? serializeId(doc.handledBy) : null,
    reviewedAt: toIsoDate(doc.reviewedAt),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}
