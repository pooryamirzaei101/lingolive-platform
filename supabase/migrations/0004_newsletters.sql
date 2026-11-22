CREATE TABLE IF NOT EXISTS "newsletters" ("id" text PRIMARY KEY NOT NULL,"subject" text NOT NULL,"body" text NOT NULL,"sent_by" text NOT NULL,"recipient_count" bigint DEFAULT 0 NOT NULL,"status" text DEFAULT 'sent' NOT NULL,"sent_at" bigint,"created_at" bigint NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletters_created" ON "newsletters" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_attachments" ("id" text PRIMARY KEY NOT NULL,"newsletter_id" text NOT NULL,"file_name" text NOT NULL,"file_key" text NOT NULL,"file_type" text NOT NULL,"file_size" bigint NOT NULL,"created_at" bigint NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_attachments_newsletter" ON "newsletter_attachments" ("newsletter_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_recipients" ("id" text PRIMARY KEY NOT NULL,"newsletter_id" text NOT NULL,"user_id" text NOT NULL,"email" text NOT NULL,"delivery_status" text DEFAULT 'logged' NOT NULL,"delivered_at" bigint,"created_at" bigint NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_recipients_newsletter" ON "newsletter_recipients" ("newsletter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_recipients_user" ON "newsletter_recipients" ("user_id");