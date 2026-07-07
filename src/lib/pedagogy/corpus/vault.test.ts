// Vault validity — this is the CI guard for corpus/pedagogy/.
// If an entry drifts from the contract (unknown key, bad list syntax, licence
// violation, duplicate id), the unit job fails and names the file.

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { compileVault } from './vault';
import { FRAMEWORKS } from './types';

const VAULT_ROOT = path.join(process.cwd(), 'corpus', 'pedagogy');

describe('corpus/pedagogy vault', () => {
  const output = compileVault(VAULT_ROOT);

  it('compiles with zero issues', () => {
    expect(output.issues).toEqual([]);
  });

  it('contains the migrated corpora', () => {
    expect(output.coverage['charlotte-mason']).toBeTruthy();
    const cm = output.coverage['charlotte-mason'];
    expect(cm['source-excerpts']).toBeGreaterThanOrEqual(20);
    expect(cm['facilitation-vocabulary']).toBe(1);
    expect(output.coverage['unschooling']['source-excerpts']).toBeGreaterThanOrEqual(8);
    expect(output.coverage['montessori']['worked-examples']).toBeGreaterThanOrEqual(8);
    expect(output.docs.length).toBeGreaterThanOrEqual(87);
  });

  it('gives every document a deterministic, framework-consistent id', () => {
    const shorts = new Set(FRAMEWORKS.map((f) => f.short));
    for (const doc of output.docs) {
      const [type, short] = doc._id.split('.');
      expect(type).toBe(doc._type);
      expect(shorts.has(short), `${doc._id} has unknown framework short code`).toBe(true);
    }
  });

  it('keeps the migrated CM corpus human-confirmed and resolves the review flag everywhere', () => {
    for (const doc of output.docs) {
      // Confirmations only ever move draft→confirmed by human edit; the CM
      // migration arrived confirmed (it shipped to prod that way) and must not regress.
      if (doc._id.includes('.cm.') || doc._id === 'pedagogyFacilitationVocabulary.cm') {
        expect(doc.suggestedDraft, `${doc._id} — CM migration must stay confirmed`).toBe(false);
      }
      expect(typeof doc.suggestedDraft, `${doc._id} — review flag must resolve to a boolean`).toBe('boolean');
    }
  });

  it('registers every source-excerpt against the licence registry', () => {
    for (const doc of output.docs) {
      if (doc._type !== 'pedagogySourceExcerpt') continue;
      expect(doc.sourceAttribution?.author, `${doc._id} missing attribution author`).toBeTruthy();
      expect(doc.sourceAttribution?.title, `${doc._id} missing attribution title`).toBeTruthy();
    }
  });
});
