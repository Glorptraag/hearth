import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub out the network-bearing pieces. We only care that:
//   1. Importing `@/lib/db` does NOT touch process.env / neon() at load time.
//   2. The first property access on `db` (or call to `getDb()`) is what
//      triggers the env check + neon() construction.
//   3. A missing DATABASE_URL throws a typed ConfigError, not a generic Error.
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => 'NEON_CLIENT'),
}));
vi.mock('drizzle-orm/neon-http', () => ({
  // Return a recognisable shape so we can assert the proxy forwards.
  drizzle: vi.fn(() => ({ query: { learners: { findMany: vi.fn(async () => []) } } })),
}));
vi.mock('./schema', () => ({}));

describe('db (lazy proxy)', () => {
  const ORIGINAL = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules(); // force re-import so the cached singleton resets
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL;
  });

  it('does not call neon() at module load (env-free import is safe)', async () => {
    delete process.env.DATABASE_URL;
    const { neon } = await import('@neondatabase/serverless');

    // Importing the module must succeed even with no DATABASE_URL.
    await expect(import('./index')).resolves.toBeDefined();

    expect(neon).not.toHaveBeenCalled();
  });

  it('throws ConfigError on first use when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    const { getDb, ConfigError } = await import('./index');

    expect(() => getDb()).toThrowError(ConfigError);
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
  });

  it('ConfigError carries a stable code so callers can branch on it', async () => {
    delete process.env.DATABASE_URL;
    const { getDb } = await import('./index');

    try {
      getDb();
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as { code?: string }).code).toBe('CONFIG_ERROR');
      expect((err as Error).name).toBe('ConfigError');
    }
  });

  it('initializes neon() lazily on first property access of the db proxy', async () => {
    process.env.DATABASE_URL = 'postgres://example';
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { db } = await import('./index');

    // No calls yet — proxy hasn't been touched.
    expect(neon).not.toHaveBeenCalled();
    expect(drizzle).not.toHaveBeenCalled();

    // Touch any property — should construct exactly once.
    void db.query;
    void db.query;
    void db.query;
    expect(neon).toHaveBeenCalledTimes(1);
    expect(drizzle).toHaveBeenCalledTimes(1);
    expect(neon).toHaveBeenCalledWith('postgres://example');
  });
});
