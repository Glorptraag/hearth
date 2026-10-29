/**
 * Hearth demo family: seed + reset (launch pivot W7.2).
 *
 * Creates (or resets) ONE demo family for the expo stand: two learners and six
 * photo moments whose `read_output` is pre-baked, so the stand works even if
 * the Read API is slow. Some moments carry `drafted_by: 'read'` and a Shelf
 * `working_from`; each moment has parent-confirmed DLO links (provenance
 * 'asserted') and `learner_dlo_status` is rolled up, so the Report and the
 * Constellation have content.
 *
 * The family is identified by a FIXED id and Clerk id (fixtures/demo/moments.json).
 * Reset removes only that family's rows (the same statements account deletion
 * uses), then recreates it. No other family is ever read or written. The
 * dashboard snapshot is NOT pre-built; it rebuilds on first use.
 *
 * Safety (all enforced before any connection is opened):
 *   - a database must be given explicitly: --database-url <url> or DATABASE_URL.
 *     .env.local is deliberately NOT loaded by this script.
 *   - --confirm is required to write (--dry-run prints the plan and exits).
 *   - any non-loopback host is treated as production and needs --allow-prod.
 *
 * Local run (no docker daemon needed; Postgres 16 + pgvector from the OS):
 *   initdb -D /tmp/hearth-demo/data -U postgres --auth=trust
 *   pg_ctl -D /tmp/hearth-demo/data -o '-p 5433 -k /tmp/hearth-demo' -l /tmp/hearth-demo/log start -w
 *   createdb -h localhost -p 5433 -U postgres hearth_demo
 *   DATABASE_URL=postgresql://postgres@localhost:5433/hearth_demo npm run db:migrate
 *   npm run seed:demo -- --database-url postgresql://postgres@localhost:5433/hearth_demo --confirm
 * or against the docker test DB (npm run test:integration:local starts one on :5432):
 *   npm run seed:demo -- --database-url postgresql://postgres:postgres@localhost:5432/hearth_test --confirm
 *
 * Flags: --confirm  --dry-run  --reset-only  --allow-prod
 *
 * Photos: if BLOB_READ_WRITE_TOKEN is set, the placeholder images in
 * fixtures/demo/images/ are uploaded to private Blob at
 * evidence/<familyId>/<moment>.jpg. Without it the evidence rows store those
 * same paths but no bytes exist behind them (photos 404 in the UI); the output
 * says so. See fixtures/demo/README.md for swapping in the real photos.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { familyDeletionStatements } from '../src/lib/account/delete';
import { SHELF_FIXTURE } from '../src/lib/shelf/match.test-fixtures';
import {
  assessDatabaseUrl,
  checkSafety,
  parseSeedArgs,
  rollupStatus,
  validateFixture,
  type DemoFixture,
} from '../src/lib/demo/seed-plan';

const ROOT = resolve(__dirname, '..');
const FIXTURE_DIR = resolve(ROOT, 'fixtures/demo');

function fail(message: string): never {
  console.error(`seed-demo-family: ${message}`);
  process.exit(1);
}

function dateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function uploadImages(fixture: DemoFixture): Promise<Map<string, string>> {
  const refs = new Map<string, string>();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const familyId = fixture.family.id;
  let uploaded = 0;
  let blob: typeof import('@vercel/blob') | null = null;
  if (token) blob = await import('@vercel/blob');
  for (const m of fixture.moments) {
    const fallback = `evidence/${familyId}/${m.key}.jpg`;
    if (!blob) {
      refs.set(m.key, fallback);
      continue;
    }
    try {
      const bytes = readFileSync(resolve(FIXTURE_DIR, m.image));
      const put = await blob.put(fallback, bytes, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/jpeg',
      });
      refs.set(m.key, put.pathname);
      uploaded++;
    } catch (err) {
      console.warn(`  ! Blob upload failed for ${m.key} (${(err as Error).message}); storing placeholder path`);
      refs.set(m.key, fallback);
    }
  }
  if (!token) {
    console.log('  Blob: BLOB_READ_WRITE_TOKEN not set. Evidence rows hold placeholder paths; no image bytes were uploaded.');
  } else {
    console.log(`  Blob: uploaded ${uploaded}/${fixture.moments.length} images to private storage.`);
  }
  return refs;
}

async function main() {
  const args = parseSeedArgs(process.argv.slice(2), process.env);
  const problems = checkSafety(args);
  if (problems.length > 0) fail(problems.join('\n  '));

  const fixture = validateFixture(
    JSON.parse(readFileSync(resolve(FIXTURE_DIR, 'moments.json'), 'utf8')),
    SHELF_FIXTURE,
  );
  const { family } = fixture;
  const where = assessDatabaseUrl(args.databaseUrl!);

  console.log(`Demo family ${family.id} (${family.clerkUserId}) on ${where.host}/${where.database}`);
  console.log(`  Plan: reset${args.resetOnly ? ' only' : ` + create ${fixture.learners.length} learners, ${fixture.moments.length} photo moments`}`);
  if (args.dryRun) {
    for (const m of fixture.moments) {
      console.log(`  - ${m.key}: ${m.title} [drafted_by ${m.draftedBy}${m.workingFrom ? `, working_from ${m.workingFrom.resourceId} #${m.workingFrom.lesson}` : ''}, ${m.dloLinks.length} DLO link(s)]`);
    }
    console.log('Dry run: nothing written.');
    return;
  }

  const needsSsl = /sslmode=require/.test(args.databaseUrl!) || /neon\.tech/.test(args.databaseUrl!);
  const client = new Client({ connectionString: args.databaseUrl!, ssl: needsSsl ? { rejectUnauthorized: false } : false });
  await client.connect();
  const db = drizzle(client, { schema });

  try {
    // Never adopt someone else's identity: the demo Clerk id must be free or ours.
    const clash = await db.query.families.findFirst({ where: eq(schema.families.clerkUserId, family.clerkUserId) });
    if (clash && clash.id !== family.id) {
      fail(`a different family (${clash.id}) already uses Clerk id ${family.clerkUserId}; refusing to touch it.`);
    }
    const idClash = await db.query.families.findFirst({ where: eq(schema.families.id, family.id) });
    if (idClash && idClash.clerkUserId !== family.clerkUserId) {
      fail(`family ${family.id} exists but belongs to Clerk id ${idClash.clerkUserId}, not the demo user; refusing to touch it.`);
    }

    const refs = args.resetOnly ? new Map<string, string>() : await uploadImages(fixture);

    await db.transaction(async (tx) => {
      // ── Reset: only this family's rows ──
      if (idClash) {
        const createdHearths = await tx
          .select({ id: schema.hearths.id })
          .from(schema.hearths)
          .where(eq(schema.hearths.createdByFamilyId, family.id));
        const statements = familyDeletionStatements(
          tx as never,
          family.id,
          family.clerkUserId,
          { transfers: [], deletedHearthIds: createdHearths.map((h) => h.id) },
        );
        for (const s of statements) await s;
        console.log('  Reset: removed the existing demo family and everything keyed to it.');
      } else {
        console.log('  Reset: no existing demo family.');
      }
      if (args.resetOnly) return;

      // ── Create ──
      await tx.insert(schema.families).values({
        id: family.id,
        clerkUserId: family.clerkUserId,
        familyName: family.familyName,
        onboardingComplete: true,
        welcomeCompletedAt: new Date(),
        photoReadOptIn: true,
      });
      await tx.insert(schema.familySettings).values({ familyId: family.id, state: family.state });

      const learnerIds = new Map<string, string>();
      for (const l of fixture.learners) {
        const [row] = await tx
          .insert(schema.learners)
          .values({
            familyId: family.id,
            name: l.name,
            dateOfBirth: l.dateOfBirth,
            shapeIcon: l.shapeIcon,
            colourToken: l.colourToken,
            displayOrder: l.displayOrder,
          })
          .returning({ id: schema.learners.id });
        learnerIds.set(l.key, row.id);
      }

      const links = new Map<string, { learnerId: string; dloId: string; tier: 'emerging' | 'developing' | 'demonstrating'; entryId: string; date: Date }[]>();

      for (const m of fixture.moments) {
        const date = dateDaysAgo(m.daysAgo);
        const description = m.draftedBy === 'read' ? m.readOutput.doing : (m.description ?? null);
        const evidenceRef = refs.get(m.key) ?? `evidence/${family.id}/${m.key}.jpg`;
        const attributed = [m.learner, ...m.alsoLearners].map((k) => learnerIds.get(k)!);

        const [entry] = await tx
          .insert(schema.learningEntries)
          .values({
            familyId: family.id,
            title: m.title,
            description,
            dateOccurred: date,
            subjects: m.subjects,
            learnerIds: attributed,
            evidenceUrls: [evidenceRef],
            source: 'logger',
            status: 'complete',
            draftedBy: m.draftedBy,
            readOutput: m.readOutput,
            workingFrom: m.workingFrom ?? null,
          })
          .returning({ id: schema.learningEntries.id });

        await tx.insert(schema.learningEntryEvidence).values({
          entryId: entry.id,
          kind: 'photo',
          content: evidenceRef,
          sortOrder: 0,
          metadata: { demo: true, uploaded: refs.has(m.key) && !!process.env.BLOB_READ_WRITE_TOKEN },
        });

        for (const l of m.dloLinks) {
          const learnerId = learnerIds.get(l.learner ?? m.learner)!;
          await tx.insert(schema.observationDloLinks).values({
            observationId: entry.id,
            learnerId,
            dloId: l.dloId,
            tier: l.tier,
            confidence: '1',
            provenance: 'asserted',
            evidenceState: 'observed',
          });
          const key = `${learnerId}|${l.dloId}`;
          const list = links.get(key) ?? [];
          list.push({ learnerId, dloId: l.dloId, tier: l.tier, entryId: entry.id, date: new Date(`${date}T09:00:00Z`) });
          links.set(key, list);
        }
      }

      for (const list of links.values()) {
        const last = list.reduce((a, b) => (b.date > a.date ? b : a));
        await tx.insert(schema.learnerDloStatus).values({
          learnerId: last.learnerId,
          dloId: last.dloId,
          status: rollupStatus(list.map((l) => ({ tier: l.tier, provenance: 'asserted' as const }))),
          confidence: '1',
          lastObservedAt: last.date,
          sourceObservationId: last.entryId,
        });
      }

      console.log(`  Created: ${fixture.learners.length} learners, ${fixture.moments.length} moments, ${[...links.values()].reduce((n, l) => n + l.length, 0)} confirmed DLO links, ${links.size} DLO statuses.`);
    });
  } finally {
    await client.end();
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
