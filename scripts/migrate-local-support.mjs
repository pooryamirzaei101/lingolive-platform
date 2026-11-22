import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("file://local-data/pglite");
await db.waitReady;
const exists = await db.query("select column_name from information_schema.columns where table_name = 'support_tickets' and column_name = 'admin_unread'");
if (!exists.rows.length) {
  const source = await readFile("supabase/migrations/0003_support_inbox.sql", "utf8");
  for (const statement of source.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) await db.exec(statement);
}
console.log("support-migration=ready");
await db.close();