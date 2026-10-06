DROP TABLE "bgg_connections" CASCADE;--> statement-breakpoint
ALTER TABLE "collection_items" DROP COLUMN "source";--> statement-breakpoint
DROP TYPE "public"."collection_source";--> statement-breakpoint
DROP TYPE "public"."sync_status";