import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("file://local-data/pglite");
await db.waitReady;
const source = await readFile("supabase/migrations/0004_newsletters.sql", "utf8");
for (const statement of source.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) await db.exec(statement);
console.log("newsletter-migration=ready");
await db.close();