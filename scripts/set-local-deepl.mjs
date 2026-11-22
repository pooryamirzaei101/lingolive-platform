import {PGlite} from '@electric-sql/pglite';
const db=new PGlite('file://local-data/pglite');await db.waitReady;
await db.exec("UPDATE media_integrations SET translation_provider='deepl', enabled=0 WHERE id='main'");
console.log('local-translation-provider=deepl');await db.close();
