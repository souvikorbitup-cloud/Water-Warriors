import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function UnmatchedLocalePage(): Promise<never> {
  await connection();
  notFound();
}
