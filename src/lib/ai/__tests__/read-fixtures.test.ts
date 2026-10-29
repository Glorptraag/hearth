import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseReadOutput, READ_ARTEFACTS, type ReadArtefact } from '../read-schema';
import { matchShelf, type ShelfMatch } from '@/lib/shelf/match';
import { SHELF_FIXTURE } from '@/lib/shelf/match.test-fixtures';

type PhotoCase = {
  id: string;
  imagePath: string;
  recordedRead: unknown;
  expectedArtefact: ReadArtefact;
  expectedShelfMatch: ShelfMatch | null;
  expectedRouteNote: string;
};

const { cases } = JSON.parse(
  readFileSync(join(process.cwd(), 'fixtures/photos/cases.json'), 'utf8'),
) as { cases: PhotoCase[] };

describe('photo read fixtures', () => {
  it('has 10 cases with unique ids', () => {
    expect(cases).toHaveLength(10);
    expect(new Set(cases.map((c) => c.id)).size).toBe(10);
  });

  it.each(cases.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    expect(c.imagePath).toMatch(/^fixtures\/photos\/images\//);
    expect(READ_ARTEFACTS).toContain(c.expectedArtefact);

    const read = parseReadOutput(c.recordedRead);
    expect(read).not.toBeNull();
    expect(read!.artefact).toBe(c.expectedArtefact);
    if (read!.confidence === 'low') expect(read!.doing).toBe('');

    expect(matchShelf(read!.printedText, SHELF_FIXTURE)).toEqual(c.expectedShelfMatch);
  });
});
