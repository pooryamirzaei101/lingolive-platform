ALTER TABLE `payment_settings` ADD `iran_provider` text DEFAULT 'zarinpal' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `zibal_merchant` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `international_provider` text DEFAULT 'stripe' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `paypal_client_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `paypal_secret` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `paypal_mode` text DEFAULT 'sandbox' NOT NULL;
