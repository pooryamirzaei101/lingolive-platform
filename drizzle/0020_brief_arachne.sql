ALTER TABLE `media_integrations` ADD `translation_provider` text DEFAULT 'deepl' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_integrations` ADD `deepl_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_integrations` ADD `deepl_plan` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_integrations` ADD `azure_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_integrations` ADD `azure_region` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `media_integrations` SET `translation_provider`='google' WHERE `google_key`<>'';
