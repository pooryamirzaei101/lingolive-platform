ALTER TABLE media_integrations ALTER COLUMN translation_provider SET DEFAULT 'deepl';
--> statement-breakpoint
UPDATE media_integrations SET translation_provider='deepl', enabled=0 WHERE translation_provider='google' AND google_key='';
