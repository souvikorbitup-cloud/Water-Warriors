import "server-only";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import DiyGuide, { type IDiyGuide } from "@/lib/models/Diyguide.model";
import type { ContentListQueryInput, DiyGuideInput } from "./schemas";
import {
  buildDiyGuideFilter,
  paginateMeta,
  toContentMongoSort,
  toDiyGuideListItem,
} from "./query";
import type {
  ContentListResponse,
  DiyGuideListItem,
} from "../../types/content";

export async function listDiyGuides(
  query: ContentListQueryInput,
): Promise<ContentListResponse<DiyGuideListItem>> {
  await connectDB();
  const filter = buildDiyGuideFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    DiyGuide.find(filter)
      .sort(toContentMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<IDiyGuide & { _id: unknown }>>(),
    DiyGuide.countDocuments(filter),
  ]);

  return {
    items: items.map(toDiyGuideListItem),
    ...paginateMeta(query.page, query.limit, total),
  };
}

export async function createDiyGuide(
  input: DiyGuideInput,
  userId: Types.ObjectId,
) {
  await connectDB();
  const { thumbnail, ...rest } = input;
  const doc = await DiyGuide.create({
    ...rest,
    ...(thumbnail ? { thumbnail } : {}),
    isPublished: input.isPublished ?? false,
    createdBy: userId,
    updatedBy: userId,
  });
  return toDiyGuideListItem(doc);
}

export async function getPublicDiyGuides(
  locale: string,
  opts?: { limit?: number },
) {
  try {
    await connectDB();
    return await DiyGuide.getPublic(locale, opts);
  } catch (error) {
    console.error("Failed to load public DIY guides:", error);
    throw error;
  }
}
