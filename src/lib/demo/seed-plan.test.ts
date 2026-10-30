import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assessDatabaseUrl,
  checkSafety,
  parseSeedArgs,
  rollupStatus,
  validateFixture,
} from './seed-plan';
import { SHELF_FIXTURE } from '@/lib/shelf/match.test-fixtures';

const fixturePath = resolve(__dirname, '../../../fixtures/demo/moments.json');
const raw = () => JSON.parse(readFileSync(fixturePath, 'utf8'));

describe('parseSeedArgs', () => {
  it('reads flags and an explicit --database-url over DATABASE_URL', () => {
    const a = parseSeedArgs(['--database-url', 'postgres://a/x', '--confirm', '--dry-run'], { DATABASE_URL: 'postgres://env/y' });
    expect(a).toMatchObject({ databaseUrl: 'postgres://a/x', confirm: true, dryRun: true, allowProd: false });
  });
  it('falls back to DATABASE_URL and supports --flag=value', () => {
    expect(parseSeedArgs([], { DATABASE_URL: 'postgres://env/y' }).databaseUrl).toBe('postgres://env/y');
    expect(parseSeedArgs(['--database-url=postgres://b/z'], {}).databaseUrl).toBe('postgres://b/z');
  });
});

describe('checkSafety', () => {
  const local = 'postgresql://postgres:postgres@localhost:5433/hearth_test';
  it('requires a database', () => {
    expect(checkSafety(parseSeedArgs(['--confirm'], {})).join(' ')).toMatch(/No database/);
  });
  it('requires --confirm to write but not for a dry run', () => {
    expect(checkSafety(parseSeedArgs(['--database-url', local], {})).join(' ')).toMatch(/--confirm/);
    expect(checkSafety(parseSeedArgs(['--database-url', local, '--dry-run'], {}))).toEqual([]);
    expect(checkSafety(parseSeedArgs(['--database-url', local, '--confirm'], {}))).toEqual([]);
  });
  it('refuses non-local hosts without --allow-prod', () => {
    const prod = 'postgresql://u:p@ep-cool-123.ap-southeast-2.aws.neon.tech/neondb?sslmode=require';
    expect(checkSafety(parseSeedArgs(['--database-url', prod, '--confirm'], {})).join(' ')).toMatch(/looks like production/);
    expect(checkSafety(parseSeedArgs(['--database-url', prod, '--confirm', '--allow-prod'], {}))).toEqual([]);
  });
  it('treats an unparseable URL as unsafe', () => {
    expect(checkSafety(parseSeedArgs(['--database-url', 'not a url', '--confirm'], {})).length).toBeGreaterThan(0);
  });
  it('recognises loopback hosts', () => {
    expect(assessDatabaseUrl('postgres://x@127.0.0.1:5432/d').isLocal).toBe(true);
    expect(assessDatabaseUrl('postgres://x@db.internal:5432/d').isLocal).toBe(false);
  });
});

describe('validateFixture', () => {
  it('accepts the committed demo fixture: 6 moments, valid Reads, Shelf agreement', () => {
    const f = validateFixture(raw(), SHELF_FIXTURE);
    expect(f.moments).toHaveLength(6);
    expect(f.moments.filter((m) => m.workingFrom).length).toBeGreaterThanOrEqual(2);
    expect(f.moments.some((m) => m.draftedBy === 'read')).toBe(true);
    expect(f.moments.flatMap((m) => m.dloLinks).length).toBeGreaterThanOrEqual(4);
  });
  it('rejects a Read that fails read-schema', () => {
    const r = raw();
    r.moments[0].readOutput.artefact = 'hologram';
    expect(() => validateFixture(r, SHELF_FIXTURE)).toThrow(/read-schema/);
  });
  it('rejects a working_from the Shelf does not support', () => {
    const r = raw();
    r.moments[0].workingFrom.lesson = '99';
    expect(() => validateFixture(r, SHELF_FIXTURE)).toThrow(/lesson/);
  });
  it('rejects a DLO whose id and tier disagree', () => {
    const r = raw();
    r.moments[0].dloLinks[0].tier = 'emerging';
    expect(() => validateFixture(r, SHELF_FIXTURE)).toThrow(/disagrees/);
  });
});

describe('rollupStatus', () => {
  it('mirrors the evidence bar for asserted links', () => {
    expect(rollupStatus([{ tier: 'developing', provenance: 'asserted' }])).toBe('developing');
    expect(rollupStatus([{ tier: 'developing', provenance: 'inferred' }])).toBe('not-started');
    expect(rollupStatus([{ tier: 'emerging', provenance: 'asserted' }])).toBe('emerging');
    expect(rollupStatus([{ tier: 'demonstrating', provenance: 'asserted' }])).toBe('demonstrating');
  });
});
