ALTER TABLE "observation_dlo_links" ALTER COLUMN "observation_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "odl_parent_assertion_uniq" ON "observation_dlo_links" USING btree ("learner_id","dlo_id") WHERE "provenance" = 'asserted' and "observation_id" is null;
