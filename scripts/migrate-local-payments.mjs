import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite('file://local-data/pglite');
await db.waitReady;
const columns=await db.query("select column_name from information_schema.columns where table_name='payment_settings'");
if(!columns.rows.some(row=>row.column_name==='iran_provider')){
 const sql=await readFile('supabase/migrations/0006_payment_gateways.sql','utf8');
 for(const statement of sql.split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.exec(statement);
}
console.log('payment-gateways-migration=ready');
await db.close();
