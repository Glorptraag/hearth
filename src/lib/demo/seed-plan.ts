/**
 * Pure logic behind `scripts/seed-demo-family.ts` (W7.2): argument parsing, the
 * production-safety guard, fixture validation and the DLO status roll-up. No
 * IO here, so it is unit-tested in the normal `src/**` suite.
 */
import { z } from 'zod';
import { parseReadOutput, type ReadOutput } from '@/lib/ai/read-schema';
import { matchShelf } from '@/lib/shelf/match';
import type { ShelfResource } from '@/lib/shelf/types';

export const DEMO_FAMILY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// ── Arguments + safety ─────────────────────────────────────────────────────

export interface SeedArgs {
  databaseUrl: string | null;
  confirm: boolean;
  allowProd: boolean;
  dryRun: boolean;
  resetOnly: boolean;
}

export function parseSeedArgs(argv: string[], env: Record<string, string | undefined>): SeedArgs {
  const args: SeedArgs = {
    databaseUrl: null,
    confirm: false,
    allowProd: false,
    dryRun: false,
    resetOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--confirm') args.confirm = true;
    else if (a === '--allow-prod') args.allowProd = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--reset-only') args.resetOnly = true;
    else if (a === '--database-url') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args.databaseUrl = next;
        i++;
      }
    } else if (a.startsWith('--database-url=')) {
      args.databaseUrl = a.slice('--database-url='.length) || null;
    }
  }
  if (!args.databaseUrl && env.DATABASE_URL) args.databaseUrl = env.DATABASE_URL;
  return args;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']);

export interface DatabaseAssessment {
  host: string | null;
  database: string | null;
  isLocal: boolean;
}

export function assessDatabaseUrl(url: string): DatabaseAssessment {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // Unix-socket style URLs (?host=/path) have an empty hostname: local.
    const isLocal = LOCAL_HOSTS.has(host) || (host === '' && u.searchParams.has('host'));
    return { host: host || null, database: u.pathname.replace(/^\//, '') || null, isLocal };
  } catch {
    return { host: null, database: null, isLocal: false };
  }
}

/**
 * Anything that is not a loopback host "looks like production" (Neon, RDS,
 * Supabase, a shared dev branch ...): the script only touches it when the
 * operator says `--allow-prod`. Returns the reasons the run must stop; empty
 * means go.
 */
export function checkSafety(args: SeedArgs): string[] {
  const problems: string[] = [];
  if (!args.databaseUrl) {
    problems.push('No database given. Pass --database-url <url> or set DATABASE_URL (.env.local is never read).');
    return problems;
  }
  const where = assessDatabaseUrl(args.databaseUrl);
  if (!where.host && !where.isLocal) {
    problems.push('The database URL could not be parsed.');
    return problems;
  }
  if (!args.confirm && !args.dryRun) {
    problems.push('Refusing to write without --confirm (or use --dry-run to see the plan).');
  }
  if (!where.isLocal && !args.allowProd) {
    problems.push(
      `Host "${where.host}" is not local, so it looks like production. Re-run with --allow-prod if you really mean to seed it.`,
    );
  }
  return problems;
}

// ── Fixture ────────────────────────────────────────────────────────────────

const LearnerKey = z.string().min(1);

const FixtureSchema = z.object({
  family: z.object({
    id: z.string().regex(DEMO_FAMILY_ID_PATTERN),
    clerkUserId: z.string().min(1),
    familyName: z.string().min(1),
    state: z.string().min(2),
  }),
  learners: z
    .array(
      z.object({
        key: LearnerKey,
        name: z.string().min(1),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        shapeIcon: z.string(),
        colourToken: z.string(),
        displayOrder: z.number().int(),
      }),
    )
    .min(1),
  moments: z
    .array(
      z.object({
        key: z.string().min(1),
        image: z.string().min(1),
        daysAgo: z.number().int().nonnegative(),
        learner: LearnerKey,
        alsoLearners: z.array(LearnerKey).optional().default([]),
        title: z.string().min(1),
        description: z.string().optional(),
        draftedBy: z.enum(['parent', 'read']),
        subjects: z.array(z.string()).default([]),
        workingFrom: z
          .object({ resourceId: z.string(), lesson: z.string().optional(), source: z.enum(['read', 'parent']) })
          .nullable(),
        readOutput: z.unknown(),
        dloLinks: z
          .array(
            z.object({
              dloId: z.string().regex(/^dlo\.[A-Z]+\d+\.(emerging|developing|demonstrating)$/),
              tier: z.enum(['emerging', 'developing', 'demonstrating']),
              learner: LearnerKey.optional(),
            }),
          )
          .default([]),
      }),
    )
    .min(1),
});

export type DemoFixture = Omit<z.infer<typeof FixtureSchema>, 'moments'> & {
  moments: (Omit<z.infer<typeof FixtureSchema>['moments'][number], 'readOutput'> & { readOutput: ReadOutput })[];
};

/**
 * Validate the fixture file. Throws one error listing every problem:
 *  - structure (zod)
 *  - each readOutput passes `parseReadOutput` unchanged (no silent repair)
 *  - a `working_from` agrees with what `matchShelf` derives from printedText
 *  - DLO ids follow `dlo.<THREAD>.<tier>` and agree with their tier
 *  - read-drafted entries have a confident Read to quote
 */
export function validateFixture(raw: unknown, shelf: ShelfResource[]): DemoFixture {
  const parsed = FixtureSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Demo fixture is malformed: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const f = parsed.data;
  const problems: string[] = [];
  const learnerKeys = new Set(f.learners.map((l) => l.key));
  const moments: DemoFixture['moments'] = [];

  for (const m of f.moments) {
    const read = parseReadOutput(m.readOutput);
    if (!read) {
      problems.push(`${m.key}: readOutput does not validate against read-schema`);
      continue;
    }
    if (JSON.stringify(read) !== JSON.stringify(m.readOutput)) {
      problems.push(`${m.key}: readOutput is not in canonical form (parseReadOutput changed it)`);
    }
    for (const k of [m.learner, ...m.alsoLearners, ...m.dloLinks.map((l) => l.learner).filter(Boolean) as string[]]) {
      if (!learnerKeys.has(k)) problems.push(`${m.key}: unknown learner "${k}"`);
    }
    if (m.draftedBy === 'read' && (read.confidence !== 'high' || !read.doing)) {
      problems.push(`${m.key}: drafted_by read needs a high-confidence Read with a doing sentence`);
    }
    if (m.draftedBy === 'parent' && !m.description) {
      problems.push(`${m.key}: parent-drafted entry needs a description`);
    }
    const match = matchShelf(read.printedText, shelf);
    if (m.workingFrom) {
      if (!match || match.resourceId !== m.workingFrom.resourceId) {
        problems.push(`${m.key}: working_from ${m.workingFrom.resourceId} does not match the Shelf match (${match?.resourceId ?? 'none'})`);
      } else if (m.workingFrom.lesson !== undefined && String(match.lesson) !== m.workingFrom.lesson) {
        problems.push(`${m.key}: working_from lesson ${m.workingFrom.lesson} != matched lesson ${match.lesson}`);
      }
    } else if (match) {
      problems.push(`${m.key}: Read matches Shelf resource ${match.resourceId} but working_from is null`);
    }
    for (const l of m.dloLinks) {
      if (!l.dloId.endsWith(`.${l.tier}`)) problems.push(`${m.key}: ${l.dloId} disagrees with tier ${l.tier}`);
    }
    moments.push({ ...m, readOutput: read });
  }
  if (problems.length > 0) throw new Error(`Demo fixture invalid:\n- ${problems.join('\n- ')}`);
  return { ...f, moments };
}

// ── DLO roll-up ────────────────────────────────────────────────────────────

export type DloStatus = 'demonstrating' | 'developing' | 'emerging' | 'not-started';

/**
 * Same arithmetic as `recomputeLearnerDloStatus` (src/lib/ai/dlo-persistence.ts)
 * for parent-asserted links: any demonstrating -> demonstrating; a developing
 * that is asserted/declared (or two inferred) -> developing; any emerging ->
 * emerging.
 */
export function rollupStatus(links: { tier: 'emerging' | 'developing' | 'demonstrating'; provenance: 'asserted' | 'declared' | 'inferred' }[]): DloStatus {
  let developing = 0;
  let corroborated = 0;
  let emerging = 0;
  for (const l of links) {
    if (l.tier === 'demonstrating') return 'demonstrating';
    if (l.tier === 'developing') {
      developing++;
      if (l.provenance !== 'inferred') corroborated++;
    } else emerging++;
  }
  if (developing >= 2 || corroborated >= 1) return 'developing';
  return emerging >= 1 ? 'emerging' : 'not-started';
}
