ALTER TABLE "user" DROP CONSTRAINT "user_share_prices_check";--> statement-breakpoint
DROP INDEX "user_share_collection_idx";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_wishlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_share_token_unique" ON "user" USING btree ("share_token");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_share_token_check" CHECK ("user"."share_token" is null or "user"."share_token" ~ '^[a-f0-9]{32}$');--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_share_prices_check" CHECK (not "user"."share_prices" or "user"."share_collection" or "user"."share_wishlist");