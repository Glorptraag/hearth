CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"clerk_user_id" text,
	"email" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"invite_token" text,
	"invited_at" timestamp DEFAULT now(),
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "family_members_invite_token_unique" UNIQUE("invite_token"),
	CONSTRAINT "fm_family_email_uniq" UNIQUE("family_id","email")
);
--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fm_family_idx" ON "family_members" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "fm_clerk_idx" ON "family_members" USING btree ("clerk_user_id");