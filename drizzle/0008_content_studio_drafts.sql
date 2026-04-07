CREATE TABLE IF NOT EXISTS "content_studio_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"draft_type" text DEFAULT 'pack' NOT NULL,
	"draft_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sanity_pack_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "csd_user_status_idx" ON "content_studio_drafts" USING btree ("clerk_user_id","status");
