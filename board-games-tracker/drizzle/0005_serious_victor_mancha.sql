CREATE INDEX "collection_user_wishlist_idx" ON "collection_items" USING btree ("user_id","wishlist");--> statement-breakpoint
ALTER TABLE "collection_items" DROP COLUMN "play_count";--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_location_check" CHECK ("collection_items"."owned" <> "collection_items"."wishlist");