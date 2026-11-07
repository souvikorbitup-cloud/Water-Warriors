import "server-only";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import TeamMember, { type ITeamMember } from "@/lib/models/Teammember.model";
import type { TeamGroup } from "./constants";
import type { ContentListQueryInput, TeamMemberInput } from "./schemas";
import {
  buildTeamMemberFilter,
  paginateMeta,
  toContentMongoSort,
  toTeamMemberListItem,
} from "./query";
import type {
  ContentListResponse,
  TeamMemberListItem,
} from "../../types/content";

export async function listTeamMembers(
  query: ContentListQueryInput,
): Promise<ContentListResponse<TeamMemberListItem>> {
  await connectDB();
  const filter = buildTeamMemberFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    TeamMember.find(filter)
      .sort(toContentMongoSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .lean<Array<ITeamMember & { _id: unknown }>>(),
    TeamMember.countDocuments(filter),
  ]);

  return {
    items: items.map(toTeamMemberListItem),
    ...paginateMeta(query.page, query.limit, total),
  };
}

export async function createTeamMember(
  input: TeamMemberInput,
  userId: Types.ObjectId,
) {
  await connectDB();
  const doc = await TeamMember.create({
    ...input,
    isPublished: input.isPublished ?? false,
    createdBy: userId,
    updatedBy: userId,
  });
  return toTeamMemberListItem(doc);
}

export async function getPublicTeamByGroup(group: TeamGroup, locale: string) {
  try {
    await connectDB();
    return await TeamMember.getPublic(group, locale);
  } catch (error) {
    console.error("Failed to load public team members:", error);
    return [];
  }
}
