import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hiddenSamples } from "@/db/schema";
import { cache } from "react";

export const hiddenSampleIds = cache(async function hiddenSampleIds(): Promise<Set<string>> {
  try {
    const rows = await getDb().select({ id: hiddenSamples.id }).from(hiddenSamples).all();
    return new Set(rows.map((row: { id: string }) => row.id));
  } catch {
    return new Set<string>();
  }
});

export const isSampleHidden = cache(async function isSampleHidden(id: string): Promise<boolean> {
  try {
    return Boolean(await getDb().select({ id: hiddenSamples.id }).from(hiddenSamples).where(eq(hiddenSamples.id, id)).get());
  } catch {
    return false;
  }
});