import "server-only";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Faq, { type IFaq } from "@/lib/models/Faq.model";
import type { FaqGroup } from "./constants";
import type { ContentListQueryInput, FaqInput } from "./schemas";
import {
  buildFaqFilter,
  paginateMeta,
  toContentMongoSort,
  toFaqListItem,
} from "./query";
import type { ContentListResponse, FaqListItem } from "../../types/content";

export async function listFaqs(
  query: ContentListQueryInput,
): Promise<ContentListResponse<FaqListItem>> {
  await connectDB();
  const filter = buildFaqFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Faq.find(filter)
      .sort(toContentMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<IFaq & { _id: unknown }>>(),
    Faq.countDocuments(filter),
  ]);

  return {
    items: items.map(toFaqListItem),
    ...paginateMeta(query.page, query.limit, total),
  };
}

export async function createFaq(input: FaqInput, userId: Types.ObjectId) {
  await connectDB();
  const doc = await Faq.create({
    ...input,
    isPublished: input.isPublished ?? false,
    createdBy: userId,
    updatedBy: userId,
  });
  return toFaqListItem(doc);
}

export async function getPublicFaqs(group: FaqGroup, locale: string) {
  try {
    await connectDB();
    return await Faq.getPublic(group, locale);
  } catch (error) {
    console.error("Failed to load public FAQs:", error);
    return [];
  }
}
