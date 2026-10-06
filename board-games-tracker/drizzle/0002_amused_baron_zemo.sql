CREATE TABLE "game_images" (
	"checksum" text PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"source_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_images_checksum_check" CHECK ("game_images"."checksum" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "game_images_mime_type_check" CHECK ("game_images"."mime_type" in ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT "game_images_size_check" CHECK ("game_images"."size" > 0 and "game_images"."size" <= 5242880 and octet_length("game_images"."data") = "game_images"."size")
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "image_checksum" text;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_image_checksum_game_images_checksum_fk" FOREIGN KEY ("image_checksum") REFERENCES "public"."game_images"("checksum") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_image_checksum_idx" ON "games" USING btree ("image_checksum");