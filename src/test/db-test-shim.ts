/**
 * Integration-test stand-in for `@/lib/db`.
 *
 * `vitest.integration.config.ts` aliases the exact specifier `@/lib/db` to this
 * module, so every `import { db } from '@/lib/db'` in the code under test
 * resolves here — backed by the transaction-scoped `pg.Client` in
 * `integration-db.ts` instead of the production `neon-http` client. This keeps
 * `neon-http` out of the test path entirely and requires zero production change.
 *
 * The alias is anchored (`/^@\/lib\/db$/`) so `@/lib/db/schema` and other
 * sub-paths are NOT redirected — only the package entry itself.
 */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/lib/db/schema';
import { getTestDb } from './integration-db';

/**
 * Mirrors `ConfigError` from `src/lib/db/index.ts`. Duplicated (not imported)
 * so this shim never pulls in the production module. Handlers under test that
 * `import { ConfigError } from '@/lib/db'` get this class, and any `instanceof`
 * check stays self-consistent within the test run.
 */
export class ConfigError extends Error {
  readonly code = 'CONFIG_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Resolve the transaction-scoped Drizzle client (parity with the real getDb). */
export function getDb(): NodePgDatabase<typeof schema> {
  return getTestDb();
}

/**
 * Back-compat `db` surface. A Proxy so the connection is resolved lazily on
 * first property access — the pinned client is connected in the suite's
 * beforeAll, before any test (or handler) touches `db`.
 */
export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getTestDb() as object, prop, receiver);
    },
    has(_target, prop) {
      return prop in (getTestDb() as object);
    },
  },
);
