ALTER TABLE support_tickets ADD COLUMN admin_unread bigint NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE support_tickets ADD COLUMN user_unread bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE support_tickets ADD COLUMN internal_note text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE support_messages ADD COLUMN read_by_admin bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE support_messages ADD COLUMN read_by_user bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE support_tickets SET status = 'answered' WHERE status = 'in_progress';
--> statement-breakpoint
UPDATE support_tickets SET status = 'closed' WHERE status = 'resolved';