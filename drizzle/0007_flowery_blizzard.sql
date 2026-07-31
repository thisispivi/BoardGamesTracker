ALTER TABLE "user" ADD COLUMN "share_collection" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_prices" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "user_share_collection_idx" ON "user" USING btree ("share_collection");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_share_prices_check" CHECK (not "user"."share_prices" or "user"."share_collection");