-- Pack entitlements for Stripe one-time purchases.
-- One row per (family, sanityPackId) for premium packs the family has bought.
-- Webhook handler in src/app/api/stripe/webhook/route.ts writes here on
-- checkout.session.completed. Marketplace UI keys "Owned" off row presence.

BEGIN;

CREATE TABLE IF NOT EXISTS "entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "family_id" uuid NOT NULL REFERENCES "families"("id"),
  "sanity_pack_id" text NOT NULL,
  "stripe_session_id" text NOT NULL,
  "stripe_customer_id" text,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'aud',
  "created_at" timestamp DEFAULT now()
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_family_pack_unique_idx"
  ON "entitlements" ("family_id", "sanity_pack_id");

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_session_unique_idx"
  ON "entitlements" ("stripe_session_id");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "entitlements_family_idx"
  ON "entitlements" ("family_id");

COMMIT;
