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
import { getTestDb, getRawClient } from './integration-db';

// Monotonic counter for unique SAVEPOINT names within the test session.
// SAVEPOINT identifiers must be SQL identifiers — sequential ints keep them
// regex-safe and unambiguous in error messages.
let savepointCounter = 0;

/**
 * Stand-in for `db.transaction()` that uses SAVEPOINT semantics instead of
 * BEGIN/COMMIT.
 *
 * Why: production `db.transaction()` on node-postgres-Drizzle issues a real
 * BEGIN and COMMIT. In integration tests the suite has already opened an
 * outer transaction on the same pinned connection (via `beginTx()` in
 * `vitest.integration.setup.ts`). A nested BEGIN is silently no-op'd by
 * PostgreSQL, but the subsequent COMMIT **closes the outer transaction**,
 * so the afterEach ROLLBACK becomes a no-op and rows leak across tests
 * (cf. the canonical `integration-isolation.integration.test.ts` failures).
 *
 * The fix: substitute SAVEPOINT inside tests. Success → RELEASE; thrown →
 * ROLLBACK TO SAVEPOINT + rethrow. Either way the outer test transaction is
 * untouched. The callback receives the `db` proxy itself, so `tx.insert(…)`
 * routes through the same shimmed surface (identical behaviour to drizzle's
 * native PgTransaction for the handlers' usage pattern).
 *
 * Production code paths are unaffected — the real `@/lib/db` keeps using
 * Drizzle's native `.transaction()` because the shim is only wired up under
 * `vitest.integration.config.ts`'s alias.
 */
async function savepointTransaction<T>(
  callback: (tx: NodePgDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = getRawClient();
  const name = `tx_${++savepointCounter}`;
  await client.query(`SAVEPOINT ${name}`);
  try {
    const result = await callback(db);
    await client.query(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (err) {
    // ROLLBACK TO SAVEPOINT is safe on an aborted transaction — it brings the
    // connection back to the savepoint's state without ending the outer tx.
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    throw err;
  }
}

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
      // Intercept `transaction` so nested calls in route handlers under test
      // never close the outer per-test isolation transaction. Every other
      // method (insert/select/query/etc.) passes through unchanged.
      if (prop === 'transaction') return savepointTransaction;
      return Reflect.get(getTestDb() as object, prop, receiver);
    },
    has(_target, prop) {
      return prop in (getTestDb() as object);
    },
  },
);
