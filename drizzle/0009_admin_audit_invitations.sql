CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" text NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target_resource" text,
	"target_id" text,
	"reason" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"mfa_satisfied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_admin_user_idx" ON "admin_audit_log" USING btree ("admin_user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_target_idx" ON "admin_audit_log" USING btree ("target_resource","target_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "admin_audit_log" USING btree ("action","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"intended_family_name" text NOT NULL,
	"intended_primary_email" text,
	"intended_location_state" text,
	"source_label" text,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"redeemed_at" timestamp,
	"redeemed_by_family_id" uuid,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_by_admin_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_redeemed_by_family_id_families_id_fk" FOREIGN KEY ("redeemed_by_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "invitations" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_code_idx" ON "invitations" USING btree ("code");
