CREATE TABLE "provider_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"redeemed_by_family_id" uuid,
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "provider_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "badge_awards" ADD COLUMN "retracted_at" timestamp;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "welcome_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "family_settings" ADD COLUMN "pedagogy_values" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "family_settings" ADD COLUMN "pedagogy_practices" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "provider_codes" ADD CONSTRAINT "provider_codes_redeemed_by_family_id_families_id_fk" FOREIGN KEY ("redeemed_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;