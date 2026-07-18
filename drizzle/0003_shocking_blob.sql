ALTER TABLE "collection_items" ADD COLUMN "money_spent" numeric(12, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "families" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "currency" text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_money_spent_check" CHECK ("collection_items"."money_spent" >= 0);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_currency_check" CHECK ("user"."currency" ~ '^[A-Z]{3}$');