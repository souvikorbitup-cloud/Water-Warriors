import "server-only";
import { connectDB } from "@/lib/db";
import FeedbackSubmission, {
  type IFeedbackSubmission,
} from "@/lib/models/FeedbackSubmission.model";
import { buildFeedbackFilter, toFeedbackListItem, toMongoSort } from "./query";
import type { ListQueryInput } from "./schemas";
import type {
  FeedbackListItem,
  SubmissionsListResponse,
} from "../../types/submissions";

export async function listFeedbackSubmissions(
  query: ListQueryInput,
): Promise<SubmissionsListResponse<FeedbackListItem>> {
  await connectDB();
  const filter = buildFeedbackFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total, unread] = await Promise.all([
    FeedbackSubmission.find(filter)
      .sort(toMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<IFeedbackSubmission & { _id: unknown }>>(),
    FeedbackSubmission.countDocuments(filter),
    FeedbackSubmission.countUnread(),
  ]);

  return {
    items: items.map(toFeedbackListItem),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    unread,
  };
}
