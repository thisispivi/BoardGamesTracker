ALTER TABLE "games" ADD COLUMN "is_expansion" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "games"
SET "is_expansion" = true
WHERE EXISTS (
	SELECT 1
	FROM jsonb_array_elements_text("games"."categories") AS category(value)
	WHERE lower(trim(category.value)) IN (
		'expansion',
		'expansion for base-game',
		'fan expansion',
		'third-party expansion'
	)
);
