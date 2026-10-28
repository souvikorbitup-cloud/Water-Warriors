import {
  getAuthUserCollection,
  getAuthUserId,
  type AuthUser,
} from "@/lib/auth/auth";

/**
 * Shared helpers for resolving Better Auth user ids against the raw
 * `user` collection.
 *
 * Better Auth's users live outside Mongoose (created via the MongoDB
 * driver by `mongodbAdapter`), so there is no "user" Mongoose model —
 * `.populate("someField", "...")` against any field that stores a
 * Better Auth id (admin_id, members, addedBy, invitedBy, invitedUser,
 * etc.) will always throw `MissingSchemaError`. Every route that needs
 * user info for one of these fields should resolve it through the
 * functions below instead of calling populate().
 */

// Public-safe projection used everywhere we attach a user to a response.
// Keep this the single place that decides which auth-user fields leave
// the server. `name` is Better Auth's own field (often left blank in
// this app), so it's fetched only to build displayName as a fallback —
// prefer firstName/lastName wherever you show a person's name.
const PUBLIC_USER_PROJECTION = {
  name: 1,
  email: 1,
  firstName: 1,
  lastName: 1,
  profilePublicId: 1,
  role: 1,
} as const;

export type PublicAuthUser = Pick<
  AuthUser,
  "name" | "email" | "firstName" | "lastName" | "profilePublicId" | "role"
> & { _id: AuthUser["_id"]; displayName: string };

/**
 * firstName + lastName wins whenever either is present; falls back to
 * Better Auth's `name` field, then to the email's local part, so the UI
 * never has to show a blank string.
 */
function buildDisplayName(u: {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
}): string {
  const fromParts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  if (u.name?.trim()) return u.name.trim();
  return u.email.split("@")[0];
}

/**
 * Fetch many Better Auth users by id in one query, returned as a
 * Map keyed by stringified id for O(1) lookup while attaching them
 * to whatever documents need them.
 *
 * Accepts anything id-like (ObjectId, string, or a Mongoose subdoc's
 * id field) — duplicates and nullish entries are ignored safely.
 */
export async function getAuthUsersByIds(
  ids: Array<unknown>,
): Promise<Map<string, PublicAuthUser>> {
  const uniqueIds = Array.from(
    new Set(
      ids
        .filter((id): id is string | { toString(): string } => id != null)
        .map((id) => String(id)),
    ),
  );

  if (uniqueIds.length === 0) return new Map();

  const userCollection = getAuthUserCollection();
  const users = await userCollection
    .find(
      { _id: { $in: uniqueIds.map((id) => getAuthUserId(id)) } },
      { projection: PUBLIC_USER_PROJECTION },
    )
    .toArray();

  return new Map(
    users.map((u) => [
      String(u._id),
      { ...u, displayName: buildDisplayName(u) } as PublicAuthUser,
    ]),
  );
}

/** Convenience for a single id — same batching under the hood. */
export async function getAuthUserById(
  id: unknown,
): Promise<PublicAuthUser | null> {
  if (id == null) return null;
  const map = await getAuthUsersByIds([id]);
  return map.get(String(id)) ?? null;
}

/**
 * Resolves a Team's admin + members in one query and returns them in
 * the same shape `.populate("admin_id", "...").populate("members", "...")`
 * would have produced, without ever touching Mongoose populate.
 */
export async function attachTeamUsers(team: {
  admin_id: unknown;
  members: unknown[];
}): Promise<{ admin: PublicAuthUser | null; members: PublicAuthUser[] }> {
  const byId = await getAuthUsersByIds([team.admin_id, ...team.members]);

  const admin = byId.get(String(team.admin_id)) ?? null;
  const members = team.members
    .map((id) => byId.get(String(id)))
    .filter((u): u is PublicAuthUser => Boolean(u));

  return { admin, members };
}

/**
 * Resolves the `addedBy` user on each cart item (Cart or Team items)
 * in one batched query and returns a plain-object item array with
 * `addedBy` replaced by the resolved user (or null if not found).
 *
 * Generic over the item shape so it works for both ICartItem[] and
 * ITeam["items"] without duplicating this loop per route.
 */
export async function attachAddedByToItems<T extends { addedBy: unknown }>(
  items: T[],
): Promise<Array<Omit<T, "addedBy"> & { addedBy: PublicAuthUser | null }>> {
  const byId = await getAuthUsersByIds(items.map((i) => i.addedBy));

  return items.map((item) => ({
    ...item,
    addedBy: byId.get(String(item.addedBy)) ?? null,
  }));
}
