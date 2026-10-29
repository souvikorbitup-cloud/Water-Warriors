import "server-only";
import { getMongoDB } from "@/lib/db";
import type { Document } from "mongodb";

type SiteSettingsDocument = Document & { _id: string };

export async function getSiteSettingsCollection() {
  const collectionName = process.env.COLLECTION_NAME;

  if (!collectionName) {
    throw new Error("Please define the COLLECTION_NAME environment variable.");
  }

  return (await getMongoDB()).collection<SiteSettingsDocument>(collectionName);
}
