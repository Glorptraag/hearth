/**
 * Seed three sample packs into Sanity.
 *
 * Usage:
 *   SANITY_API_TOKEN=... npx tsx src/scripts/seed-sample-packs/index.ts
 *
 * What it does:
 *   For each pack in `./data.ts`:
 *     1) Builds the Module → Approach → Activity tree via `createFullModule`
 *        (the publish API's helper — handles circular refs).
 *     2) Creates the Pack referencing the modules' IDs.
 *   All documents are written with `status: 'draft'` so nothing surfaces
 *   to a real family until an editor flips them.
 *
 * Idempotency:
 *   Each pack uses a deterministic _id (`pack-<slug>`). Re-running the
 *   script overwrites the pack document but creates new module + activity
 *   docs each time (those use random IDs to keep edit history clean per
 *   run). If you want to re-seed cleanly, delete the previous pack +
 *   modules in Sanity Studio first, or extend this script to look up by
 *   slug and reuse IDs.
 *
 * Pre-flight:
 *   - SANITY_API_TOKEN must have write scope.
 *   - At least one capability_thread document should exist already
 *     (`npx tsx src/scripts/seed-capability-threads.ts` is the entry).
 *     Activity → thread refs are deliberately omitted in the sketches
 *     for now; flesh them out in Studio.
 */

import { createFullModule, createPack } from '@/lib/sanity/mutations';
import { SAMPLE_PACKS, type PackSketch } from './data';

interface SeedResult {
  pack: string;
  packId: string;
  moduleIds: string[];
  totalActivities: number;
}

async function seedPack(p: PackSketch): Promise<SeedResult> {
  console.log(`\n[seed] Pack: ${p.title}`);

  // Build each module first.
  const moduleResults = [] as Array<{ moduleId: string; activityCount: number }>;
  let totalActivities = 0;

  for (const m of p.modules) {
    console.log(`  · module: ${m.title} (${m.approaches.length} approaches)`);
    const built = await createFullModule({
      title: m.title,
      slug: m.slug,
      targetUnderstanding: m.targetUnderstanding,
      subjects: m.subjects,
      ageRange: m.ageRange,
      duration: m.duration,
      status: 'draft',
      createdVia: 'editorial',
      approaches: m.approaches.map((a) => ({
        title: a.title,
        slug: a.slug,
        modality: a.modality,
        description: a.description,
        status: 'draft' as const,
        activities: a.activities.map((act) => ({
          title: act.title,
          slug: act.slug,
          summary: act.summary,
          instructions: act.instructions,
          facilitatorGuidance: act.facilitatorGuidance,
          materials: act.materials,
          duration: act.duration,
          setting: act.setting,
          energyLevel: act.energyLevel,
          modality: act.modality,
          status: 'draft' as const,
        })),
      })),
    });

    const activityCount = built.approaches.reduce((acc, a) => acc + a.activityIds.length, 0);
    moduleResults.push({ moduleId: built.module._id, activityCount });
    totalActivities += activityCount;
  }

  // Now the pack pointing at those modules.
  const pack = await createPack({
    _id: `pack-${p.slug}`,
    title: p.title,
    slug: p.slug,
    description: p.description,
    moduleIds: moduleResults.map((m) => m.moduleId),
    ageRange: p.ageRange,
    subjects: p.subjects,
    termWeeks: p.termWeeks,
    moduleCount: moduleResults.length,
    totalActivities,
    worldview: p.worldview,
    availability: 'included',
    creator: 'Hearth Editorial',
    version: '0.1.0',
    status: 'draft',
  });

  console.log(`  · pack created: ${pack._id} (${moduleResults.length} modules, ${totalActivities} activities)`);

  return {
    pack: p.title,
    packId: pack._id,
    moduleIds: moduleResults.map((m) => m.moduleId),
    totalActivities,
  };
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN not set — set it before running this script.');
    process.exit(2);
  }

  console.log(`[seed] Seeding ${SAMPLE_PACKS.length} sample packs (status: draft)…`);
  const results: SeedResult[] = [];
  for (const p of SAMPLE_PACKS) {
    try {
      results.push(await seedPack(p));
    } catch (err) {
      console.error(`  ! pack failed: ${p.title}`, err);
    }
  }

  console.log('\n[seed] Done.');
  for (const r of results) {
    console.log(`  ${r.pack}: ${r.packId} → ${r.moduleIds.length} modules, ${r.totalActivities} activities`);
  }
  console.log(
    '\nNext steps:\n  1) Open Sanity Studio.\n  2) Edit each pack/module/activity for tone + Australian Curriculum mapping.\n  3) Flip status from draft → published once an editor signs off.',
  );
}

void main();
