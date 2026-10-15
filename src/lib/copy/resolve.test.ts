import { describe, it, expect } from 'vitest';
import {
  COPY_DEFAULTS,
  COPY_SURFACES,
  defaultBundle,
  formatCopy,
  normaliseSiteCopyRows,
  resolveCopy,
  siteCopyDocId,
} from './index';
import { defaultNote, defaultValue } from './defaults';

describe('copy defaults contract', () => {
  it('every surface has a title, description and at least one entry', () => {
    for (const surface of COPY_SURFACES) {
      const def = COPY_DEFAULTS[surface];
      expect(def.title.trim()).not.toBe('');
      expect(def.description.trim()).not.toBe('');
      expect(Object.keys(def.entries).length).toBeGreaterThan(0);
    }
  });

  it('every key is dotted camelCase and every default is non-empty', () => {
    const KEY_RE = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9_]+)*$/;
    for (const surface of COPY_SURFACES) {
      for (const [key, entry] of Object.entries(COPY_DEFAULTS[surface].entries)) {
        expect(key, `${surface}.${key}`).toMatch(KEY_RE);
        expect(defaultValue(entry).trim(), `${surface}.${key}`).not.toBe('');
      }
    }
  });

  it('every template with placeholders carries an editor note naming them', () => {
    for (const surface of COPY_SURFACES) {
      for (const [key, entry] of Object.entries(COPY_DEFAULTS[surface].entries)) {
        const placeholders = [...defaultValue(entry).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
        if (placeholders.length === 0) continue;
        const note = defaultNote(entry) ?? '';
        for (const p of placeholders) {
          expect(note, `${surface}.${key} note must mention {${p}}`).toContain(`{${p}}`);
        }
      }
    }
  });

  it('document ids never contain a dot (dotted ids are hidden from tokenless reads)', () => {
    for (const surface of COPY_SURFACES) {
      expect(siteCopyDocId(surface)).not.toContain('.');
    }
  });
});

describe('resolveCopy', () => {
  it('returns the defaults when there are no overrides', () => {
    expect(resolveCopy('landing', undefined)).toEqual(defaultBundle('landing'));
    expect(resolveCopy('landing', {})).toEqual(defaultBundle('landing'));
  });

  it('applies a non-empty override and ignores empty, non-string and unknown keys', () => {
    const resolved = resolveCopy('landing', {
      landing: {
        'hero.title': 'Swapped headline',
        'hero.body': '   ',
        'nav.signIn': 42 as unknown as string,
        'not.a.key': 'ignored',
      },
    });
    expect(resolved['hero.title']).toBe('Swapped headline');
    expect(resolved['hero.body']).toBe(COPY_DEFAULTS.landing.entries['hero.body']);
    expect(resolved['nav.signIn']).toBe('Sign In');
    expect('not.a.key' in resolved).toBe(false);
  });

  it('does not let one surface override leak into another', () => {
    const resolved = resolveCopy('welcome', { landing: { 'hero.title': 'X' } });
    expect(resolved['slide1.title']).toBe('Welcome to Hearth');
  });
});

describe('normaliseSiteCopyRows', () => {
  it('keeps only known surfaces/keys with non-empty values that differ from the default', () => {
    const rows = [
      {
        surface: 'landing',
        entries: [
          { key: 'hero.title', value: 'New headline' },
          { key: 'hero.body', value: COPY_DEFAULTS.landing.entries['hero.body'] }, // same as default → dropped
          { key: 'hero.cta', value: '' },
          { key: 'ghost.key', value: 'orphan' },
          null,
          { key: null, value: 'x' },
        ],
      },
      { surface: 'nope', entries: [{ key: 'a', value: 'b' }] },
      { surface: 'welcome', entries: null },
      null,
    ];
    expect(normaliseSiteCopyRows(rows)).toEqual({ landing: { 'hero.title': 'New headline' } });
  });

  it('is tolerant of garbage', () => {
    expect(normaliseSiteCopyRows(undefined)).toEqual({});
    expect(normaliseSiteCopyRows('nonsense')).toEqual({});
    expect(normaliseSiteCopyRows([{}])).toEqual({});
  });
});

describe('formatCopy', () => {
  it('fills placeholders, stringifies numbers, and leaves unknown tokens visible', () => {
    expect(formatCopy('{count} {sessions} for {names}', { count: 2, sessions: 'sessions', names: 'Ada' })).toBe(
      '2 sessions for Ada',
    );
    expect(formatCopy('Hello {name}, {typo}', { name: 'Ada', typo: undefined })).toBe('Hello Ada, {typo}');
    expect(formatCopy('{a}{a}', { a: 'x' })).toBe('xx');
  });
});
