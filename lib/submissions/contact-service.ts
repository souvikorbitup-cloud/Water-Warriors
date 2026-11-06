import "server-only";
import { connectDB } from "@/lib/db";
import ContactSubmission, {
  type IContactSubmission,
} from "@/lib/models/ContactSubmission.model";
import { buildContactFilter, toContactListItem, toMongoSort } from "./query";
import type { ListQueryInput } from "./schemas";
import type {
  ContactListItem,
  SubmissionsListResponse,
} from "../../types/submissions";

export async function listContactSubmissions(
  query: ListQueryInput,
): Promise<SubmissionsListResponse<ContactListItem>> {
  await connectDB();
  const filter = buildContactFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total, unread] = await Promise.all([
    ContactSubmission.find(filter)
      .sort(toMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<IContactSubmission & { _id: unknown }>>(),
    ContactSubmission.countDocuments(filter),
    ContactSubmission.countUnread(),
  ]);

  return {
    items: items.map(toContactListItem),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    unread,
  };
}
