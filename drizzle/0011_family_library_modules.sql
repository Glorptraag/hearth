ALTER TABLE "family_library" ALTER COLUMN "sanity_pack_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "family_library" ADD COLUMN "sanity_module_id" text;
--> statement-breakpoint
ALTER TABLE "family_library" DROP CONSTRAINT IF EXISTS "fl_family_pack_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "fl_family_pack_unique_idx" ON "family_library" ("family_id","sanity_pack_id") WHERE "sanity_pack_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "fl_family_module_unique_idx" ON "family_library" ("family_id","sanity_module_id") WHERE "sanity_module_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "family_library" ADD CONSTRAINT "fl_pack_xor_module" CHECK (("sanity_pack_id" IS NOT NULL) <> ("sanity_module_id" IS NOT NULL));
