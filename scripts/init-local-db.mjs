import {readdir,readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
const db=new PGlite("file://local-data/pglite");await db.waitReady;
for(const name of (await readdir("supabase/migrations")).filter(n=>n.endsWith(".sql")&&n>"0001_lock_down_public_tables.sql").sort()){
 const sql=await readFile(`supabase/migrations/${name}`,"utf8");
 for(const part of sql.split("--> statement-breakpoint").map(x=>x.trim()).filter(Boolean))await db.exec(part);
 console.log(`applied=${name}`);
}
await db.close();