import { describe, it, expect } from 'vitest';
import { parseEntry } from './parse';
import { compileEntry } from './compile';
import { buildChunkText, getLayerKey, type SanityPKBDocument } from '../chunk-builder';
import type { SourceRegistry } from './types';

const REGISTRY: SourceRegistry = {
  'pd-source': {
    author: 'Mason, Charlotte M.',
    title: 'Home Education',
    year: '1906',
    licence: 'public_domain',
    allowVerbatim: true,
  },
  'copyrighted-source': {
    author: 'Holt, John',
    title: 'How Children Learn',
    year: '1967',
    licence: 'in_copyright',
    allowVerbatim: false,
  },
};

function entryFile(frontmatter: string[], body: string[]): string {
  return ['---', ...frontmatter, '---', '', ...body].join('\n');
}

describe('compileEntry — source excerpts', () => {
  const path = 'charlotte-mason/source-excerpts/cm-001-test.md';

  it('compiles a verbatim excerpt from a permitted source', () => {
    const entry = parseEntry(
      path,
      entryFile(
        [
          'id: cm.001',
          'source: pd-source',
          'pageOrChapter: "Preface, Point 5"',
          'isParaphrase: false',
          'tags: [atmosphere, habit]',
          'status: published',
          'suggestedDraft: false',
        ],
        ['## Text', '', 'Therefore we are limited to three educational instruments.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(issues).toEqual([]);
    expect(doc).toEqual({
      _id: 'pedagogySourceExcerpt.cm.001',
      _type: 'pedagogySourceExcerpt',
      framework: { _type: 'reference', _ref: 'pedagogicalFramework.charlotte_mason' },
      text: 'Therefore we are limited to three educational instruments.',
      isParaphrase: false,
      sourceAttribution: {
        author: 'Mason, Charlotte M.',
        title: 'Home Education',
        year: '1906',
        pageOrChapter: 'Preface, Point 5',
      },
      tags: ['atmosphere', 'habit'],
      suggestedDraft: false,
      status: 'published',
    });
  });

  it('blocks verbatim quotation from a source without verbatim rights (PKB11 gate)', () => {
    const entry = parseEntry(
      path,
      entryFile(
        [
          'id: cm.001',
          'source: copyrighted-source',
          'pageOrChapter: "ch. 1"',
          'isParaphrase: false',
          'tags: [x]',
          'status: published',
        ],
        ['## Text', '', 'A direct quotation that must not compile.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(doc).toBeNull();
    expect(issues[0].message).toMatch(/verbatim quotation .* not permitted/);
  });

  it('allows paraphrase-with-attribution from an in-copyright source', () => {
    const entry = parseEntry(
      path,
      entryFile(
        [
          'id: cm.001',
          'source: copyrighted-source',
          'pageOrChapter: "ch. 1"',
          'isParaphrase: true',
          'attributionAuthor: "Hearth (paraphrasing John Holt)"',
          'tags: [x]',
          'status: published',
        ],
        ['## Text', '', 'A paraphrase in our own words.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(issues).toEqual([]);
    expect(doc!.isParaphrase).toBe(true);
    expect(doc!.sourceAttribution.author).toBe('Hearth (paraphrasing John Holt)');
    expect(doc!.sourceAttribution.title).toBe('How Children Learn');
  });

  it('rejects an unregistered source', () => {
    const entry = parseEntry(
      path,
      entryFile(
        ['id: cm.001', 'source: nobody-registered-this', 'pageOrChapter: "p. 1"', 'isParaphrase: true', 'tags: [x]', 'status: published'],
        ['## Text', '', 'Text.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(doc).toBeNull();
    expect(issues[0].message).toMatch(/not registered/);
  });

  it('rejects an id that does not belong to the framework directory', () => {
    const entry = parseEntry(
      path,
      entryFile(
        ['id: us.001', 'source: pd-source', 'pageOrChapter: "p. 1"', 'isParaphrase: false', 'tags: [x]', 'status: published'],
        ['## Text', '', 'Text.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(doc).toBeNull();
    expect(issues[0].message).toMatch(/does not belong to framework/);
  });

  it('defaults suggestedDraft to true when omitted (human review gate)', () => {
    const entry = parseEntry(
      path,
      entryFile(
        ['id: cm.001', 'source: pd-source', 'pageOrChapter: "p. 1"', 'isParaphrase: false', 'tags: [x]', 'status: published'],
        ['## Text', '', 'Text.']
      )
    );
    const { doc } = compileEntry(entry, REGISTRY);
    expect(doc!.suggestedDraft).toBe(true);
  });
});

describe('compileEntry — other layers', () => {
  it('compiles a practice pattern with optional anti-pattern', () => {
    const entry = parseEntry(
      'unschooling/practice-patterns/us-001-test.md',
      entryFile(
        ['id: us.001', 'triggerTitle: Child resists', 'tags: [t1]', 'status: published'],
        ['## Trigger', '', 'The situation.', '', '## Response', '', 'Para one.', '', 'Para two.', '', '## Anti-pattern', '', 'Do not.']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(issues).toEqual([]);
    expect(doc!._id).toBe('pedagogyPracticePattern.us.001');
    expect(doc!.traditionResponse).toBe('Para one.\n\nPara two.');
    expect(doc!.antiPattern).toBe('Do not.');
  });

  it('compiles an observational marker with a strict list section', () => {
    const entry = parseEntry(
      'montessori/observational-markers/montessori-004-test.md',
      entryFile(
        ['id: montessori.004', 'markerName: Care of environment', 'tags: [t]', 'status: published'],
        ['## What it indicates', '', 'Meaningful.', '', '## Look for', '', '- Sign one', '- Sign two']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(issues).toEqual([]);
    expect(doc!.markersToLookFor).toEqual(['Sign one', 'Sign two']);
  });

  it('rejects prose inside a list section', () => {
    const entry = parseEntry(
      'montessori/observational-markers/montessori-004-test.md',
      entryFile(
        ['id: montessori.004', 'markerName: X', 'tags: [t]', 'status: published'],
        ['## What it indicates', '', 'Y.', '', '## Look for', '', 'not a list item']
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(doc).toBeNull();
    expect(issues[0].message).toMatch(/must contain only/);
  });

  it('compiles the facilitation-vocabulary singleton with keyed object arrays', () => {
    const entry = parseEntry(
      'charlotte-mason/facilitation-vocabulary/cm.md',
      entryFile(
        ['id: cm', 'status: published'],
        [
          '## Verbs',
          '',
          '- **Withdraw** — Step back — present, watchful — but not directing.',
          '',
          '## Restraints',
          '',
          '- Do not praise the concentration.',
          '',
          '## Micro-scripts',
          '',
          '- **After a brief narration** — Thank you. (And then nothing else.)',
        ]
      )
    );
    const { doc, issues } = compileEntry(entry, REGISTRY);
    expect(issues).toEqual([]);
    expect(doc!._id).toBe('pedagogyFacilitationVocabulary.cm');
    // first em dash splits term from description; later em dashes survive
    expect(doc!.verbs).toEqual([
      { _key: 'verb-001', verb: 'Withdraw', meaning: 'Step back — present, watchful — but not directing.' },
    ]);
    expect(doc!.microScripts[0]).toEqual({
      _key: 'script-001',
      situation: 'After a brief narration',
      script: 'Thank you. (And then nothing else.)',
    });
  });
});

describe('compiled documents feed the live chunk pipeline', () => {
  it('buildChunkText produces non-empty embedding text for every layer', () => {
    const cases: Array<{ path: string; fm: string[]; body: string[] }> = [
      {
        path: 'charlotte-mason/source-excerpts/cm-001-t.md',
        fm: ['id: cm.001', 'source: pd-source', 'pageOrChapter: "p. 1"', 'isParaphrase: false', 'tags: [x]', 'status: published'],
        body: ['## Text', '', 'Excerpt body.'],
      },
      {
        path: 'charlotte-mason/practice-patterns/cm-001-t.md',
        fm: ['id: cm.001', 'triggerTitle: T', 'tags: [x]', 'status: published'],
        body: ['## Trigger', '', 'C.', '', '## Response', '', 'R.'],
      },
      {
        path: 'charlotte-mason/observational-markers/cm-001-t.md',
        fm: ['id: cm.001', 'markerName: M', 'tags: [x]', 'status: published'],
        body: ['## What it indicates', '', 'W.', '', '## Look for', '', '- L'],
      },
      {
        path: 'charlotte-mason/facilitation-vocabulary/cm.md',
        fm: ['id: cm', 'status: published'],
        body: ['## Verbs', '', '- **V** — m.', '', '## Restraints', '', '- r.', '', '## Micro-scripts', '', '- **s** — sc.'],
      },
      {
        path: 'charlotte-mason/contraindications/cm-001-t.md',
        fm: ['id: cm.001', 'warnedAgainst: W', 'tags: [x]', 'status: published'],
        body: ['## Reasoning', '', 'Because.'],
      },
      {
        path: 'charlotte-mason/worked-examples/cm-001-t.md',
        fm: ['id: cm.001', 'tags: [x]', 'status: published'],
        body: ['## Scenario', '', 'S.', '', '## Interpretation', '', 'I.'],
      },
    ];

    for (const c of cases) {
      const entry = parseEntry(c.path, entryFile(c.fm, c.body));
      const { doc, issues } = compileEntry(entry, REGISTRY);
      expect(issues).toEqual([]);
      const text = buildChunkText(doc as unknown as SanityPKBDocument);
      expect(text.trim().length, `${c.path} embeds empty text`).toBeGreaterThan(0);
      expect(getLayerKey(doc!._type as SanityPKBDocument['_type'])).toBeTruthy();
    }
  });
});
