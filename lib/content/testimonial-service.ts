import "server-only";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Testimonial, { type ITestimonial } from "@/lib/models/Testimonial.model";
import type { ContentListQueryInput, TestimonialInput } from "./schemas";
import {
  buildTestimonialFilter,
  paginateMeta,
  toContentMongoSort,
  toTestimonialListItem,
} from "./query";
import type {
  ContentListResponse,
  TestimonialListItem,
} from "../../types/content";

export async function listTestimonials(
  query: ContentListQueryInput,
): Promise<ContentListResponse<TestimonialListItem>> {
  await connectDB();
  const filter = buildTestimonialFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Testimonial.find(filter)
      .sort(toContentMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<ITestimonial & { _id: unknown }>>(),
    Testimonial.countDocuments(filter),
  ]);

  return {
    items: items.map(toTestimonialListItem),
    ...paginateMeta(query.page, query.limit, total),
  };
}

export async function createTestimonial(
  input: TestimonialInput,
  userId: Types.ObjectId,
) {
  await connectDB();
  const doc = await Testimonial.create({
    ...input,
    isPublished: input.isPublished ?? false,
    createdBy: userId,
    updatedBy: userId,
  });
  return toTestimonialListItem(doc);
}

export async function getPublicTestimonials(locale: string) {
  try {
    await connectDB();
    return await Testimonial.getPublic(locale);
  } catch (error) {
    console.error("Failed to load public testimonials:", error);
    return [];
  }
}
