ALTER TABLE "provider_codes" ADD COLUMN "expires_at" timestamp;
ALTER TABLE "provider_codes" ADD COLUMN "heu_label" text;
ALTER TABLE "provider_codes" ADD COLUMN "notes" text;
ALTER TABLE "provider_codes" ADD COLUMN "created_by_admin_id" text;
