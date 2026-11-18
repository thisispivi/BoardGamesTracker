ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential';--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "account" WHERE "issuer" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate an account provider without an issuer mapping';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
DROP INDEX "account_provider_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_unique" ON "account" USING btree ("issuer","account_id");
