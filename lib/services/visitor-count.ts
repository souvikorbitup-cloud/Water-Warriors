import "server-only";

import type { Document } from "mongodb";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

const VISITOR_COUNT_ID = "visitor-count";
const INITIAL_VISITOR_COUNT = 216;

type VisitorCountDocument = Document & {
  _id: string;
  count?: unknown;
};

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function parseVisitorCount(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < INITIAL_VISITOR_COUNT
  ) {
    throw new Error("Stored visitor count is invalid.");
  }
  return value;
}

async function getCollectionWithCountInitialized() {
  const collection = await getSiteSettingsCollection();
  try {
    await collection.updateOne(
      { _id: VISITOR_COUNT_ID },
      { $setOnInsert: { count: INITIAL_VISITOR_COUNT } },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  return collection;
}

export async function getVisitorCount(): Promise<number> {
  const collection = await getCollectionWithCountInitialized();
  const document = await collection.findOne<VisitorCountDocument>({
    _id: VISITOR_COUNT_ID,
  });
  if (!document) throw new Error("Visitor count could not be loaded.");
  return parseVisitorCount(document.count);
}

export async function incrementVisitorCount(): Promise<number> {
  const collection = await getCollectionWithCountInitialized();
  const result = await collection.updateOne(
    { _id: VISITOR_COUNT_ID },
    { $inc: { count: 1 } },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Visitor count could not be incremented.");
  }
  return getVisitorCount();
}
