import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Thrown when `DATABASE_URL` is missing or unreadable. Distinct from a runtime
 * query error so callers (especially the `routeHandler` wrapper) can tell
 * "your environment is broken" apart from "this particular query exploded".
 *
 * Never thrown at module load — we defer the env check until the first query,
 * so that:
 *
 *  - A missing env var on a stray edge runtime can no longer crash every route
 *    that transitively imports `@/lib/db` (the 2026-05-25 incident's
 *    amplifier path).
 *  - Tests that mock `@/lib/db` don't need a populated `DATABASE_URL` just to
 *    let the module evaluate.
 */
export class ConfigError extends Error {
  readonly code = 'CONFIG_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
let cached: DrizzleDb | null = null;

/** Resolve the singleton Drizzle client, building it on first use. */
export function getDb(): DrizzleDb {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new ConfigError(
      'DATABASE_URL is not set — the db client cannot connect. Check Vercel env vars / .env.local.'
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

/**
 * Back-compat export. Existing call sites do `import { db } from '@/lib/db'`
 * and then `db.query.X.findMany(...)`. The Proxy keeps that surface but defers
 * the actual `neon()` + `drizzle()` calls (and the env check inside them) to
 * first property access. Module load is now side-effect-free.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
  has(_target, prop) {
    return prop in (getDb() as object);
  },
});
