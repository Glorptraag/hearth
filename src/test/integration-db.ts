/**
 * Test-only database client for the INTEGRATION suite.
 *
 * Production (`src/lib/db/index.ts`) uses the `neon-http` driver, which is
 * stateless and cannot hold a session — so it can't do `BEGIN … ROLLBACK`.
 * For tests we want exactly that: wrap each test in a transaction and roll it
 * back, so the database is pristine between tests with no TRUNCATE round-trips.
 *
 * This module owns a single pinned `pg.Client`. Because every query Drizzle
 * issues flows over that one connection, a manual `BEGIN` here puts the whole
 * test — including the route handlers under test — inside one transaction, and
 * `ROLLBACK` undoes all of it. The integration vitest config aliases
 * `@/lib/db` → `db-test-shim.ts`, which serves the Drizzle instance built here,
 * so handler code that does `import { db } from '@/lib/db'` transparently runs
 * against this connection.
 *
 * NEVER imported by production code — `pg` stays out of the app bundle.
 */
import { Client } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/lib/db/schema';

let client: Client | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

/** Connect the pinned client. Call once per test file (beforeAll). */
export async function connectTestDb(): Promise<void> {
  if (client) return;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — integration tests need a database.');
  }
  // Neon endpoints require SSL (the URL carries `sslmode=require`); node-postgres
  // needs it configured explicitly. A local Postgres connects without SSL.
  const needsSsl = /sslmode=require/.test(url) || /neon\.tech/.test(url);
  client = new Client({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  dbInstance = drizzle(client, { schema });
}

/** Close the pinned client. Call once per test file (afterAll). */
export async function endTestDb(): Promise<void> {
  if (!client) return;
  await client.end();
  client = null;
  dbInstance = null;
}

/** Open a transaction on the pinned connection (beforeEach). */
export async function beginTx(): Promise<void> {
  if (!client) throw new Error('Test DB not connected — call connectTestDb() in beforeAll.');
  await client.query('BEGIN');
}

/** Roll back the current transaction, discarding everything the test wrote (afterEach). */
export async function rollbackTx(): Promise<void> {
  if (!client) return;
  await client.query('ROLLBACK');
}

/** The Drizzle handle backed by the pinned connection. Throws if not connected. */
export function getTestDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    throw new Error('Test DB not connected — call connectTestDb() in beforeAll.');
  }
  return dbInstance;
}
