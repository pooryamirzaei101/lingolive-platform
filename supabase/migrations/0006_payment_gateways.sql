ALTER TABLE payment_settings ADD COLUMN iran_provider text DEFAULT 'zarinpal' NOT NULL;
--> statement-breakpoint
ALTER TABLE payment_settings ADD COLUMN zibal_merchant text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE payment_settings ADD COLUMN international_provider text DEFAULT 'stripe' NOT NULL;
--> statement-breakpoint
ALTER TABLE payment_settings ADD COLUMN paypal_client_id text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE payment_settings ADD COLUMN paypal_secret text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE payment_settings ADD COLUMN paypal_mode text DEFAULT 'sandbox' NOT NULL;
