import { describe, expect, it } from 'vitest';
import { buildChunkMetadata } from './chunk-builder';
import type { SanityPKBDocument } from './chunk-builder';

function baseDoc(overrides: Partial<SanityPKBDocument>): SanityPKBDocument {
  return {
    _id: 'doc1',
    _type: 'pedagogySourceExcerpt',
    framework: { slug: 'charlotte_mason' },
    ...overrides,
  } as SanityPKBDocument;
}

describe('buildChunkMetadata', () => {
  describe('tags — copied when present, for every layer', () => {
    const layers: SanityPKBDocument['_type'][] = [
      'pedagogySourceExcerpt',
      'pedagogyPracticePattern',
      'pedagogyObservationalMarker',
      'pedagogyFacilitationVocabulary',
      'pedagogyContraindication',
      'pedagogyWorkedExample',
    ];

    for (const _type of layers) {
      it(`copies tags for ${_type}`, () => {
        const doc = baseDoc({ _type, tags: ['narration', 'attentiveness'] });
        const meta = buildChunkMetadata(doc);
        expect(meta.tags).toEqual(['narration', 'attentiveness']);
      });

      it(`omits tags for ${_type} when absent`, () => {
        const doc = baseDoc({ _type });
        const meta = buildChunkMetadata(doc);
        expect(meta.tags).toBeUndefined();
      });
    }
  });

  it('copies generic capabilityThreads when present', () => {
    const doc = baseDoc({
      _type: 'pedagogySourceExcerpt',
      capabilityThreads: ['observation', 'narrative_recall'],
    });
    const meta = buildChunkMetadata(doc);
    expect(meta.capabilityThreads).toEqual(['observation', 'narrative_recall']);
  });

  it('copies generic ageRange when present', () => {
    const doc = baseDoc({
      _type: 'pedagogySourceExcerpt',
      ageRange: { min: 5, max: 8 },
    });
    const meta = buildChunkMetadata(doc);
    expect(meta.ageRange).toEqual({ min: 5, max: 8 });
  });

  describe('pedagogySourceExcerpt', () => {
    it('carries text and sourceAttribution display fields', () => {
      const doc = baseDoc({
        _type: 'pedagogySourceExcerpt',
        excerptId: 'ex1',
        text: 'A quotation from the source material.',
        sourceAttribution: { author: 'Charlotte Mason', title: 'Home Education', year: '1886' },
        isParaphrase: false,
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.excerptId).toBe('ex1');
      expect(meta.text).toBe('A quotation from the source material.');
      expect(meta.sourceAttribution).toBe('Charlotte Mason, Home Education, 1886');
      expect(meta.isParaphrase).toBe(false);
    });
  });

  describe('pedagogyPracticePattern', () => {
    it('carries triggerTitle, triggerContext, traditionResponse', () => {
      const doc = baseDoc({
        _type: 'pedagogyPracticePattern',
        patternId: 'pp1',
        triggerTitle: 'Child loses focus mid-lesson',
        triggerContext: 'During a 20-minute narration exercise',
        traditionResponse: 'Shorten the lesson and revisit later',
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.triggerTitle).toBe('Child loses focus mid-lesson');
      expect(meta.triggerContext).toBe('During a 20-minute narration exercise');
      expect(meta.traditionResponse).toBe('Shorten the lesson and revisit later');
    });
  });

  describe('pedagogyObservationalMarker', () => {
    it('carries markerName, whatItIndicates, markersToLookFor', () => {
      const doc = baseDoc({
        _type: 'pedagogyObservationalMarker',
        markerId: 'om1',
        markerName: 'Sustained attention',
        whatItIndicates: 'Growing capacity for focused work',
        markersToLookFor: ['Eyes tracking the page', 'Minimal fidgeting'],
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.markerName).toBe('Sustained attention');
      expect(meta.whatItIndicates).toBe('Growing capacity for focused work');
      expect(meta.markersToLookFor).toEqual(['Eyes tracking the page', 'Minimal fidgeting']);
    });
  });

  describe('pedagogyContraindication', () => {
    it('carries warnedAgainst and keeps tensionWithOtherTraditions', () => {
      const doc = baseDoc({
        _type: 'pedagogyContraindication',
        contraindicationId: 'ci1',
        warnedAgainst: 'Over-scheduling free play',
        tensionWithOtherTraditions: 'Classical traditions may schedule more tightly',
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.warnedAgainst).toBe('Over-scheduling free play');
      expect(meta.tensionWithOtherTraditions).toBe(
        'Classical traditions may schedule more tightly'
      );
    });
  });

  describe('pedagogyWorkedExample', () => {
    it('keeps activityType copy', () => {
      const doc = baseDoc({
        _type: 'pedagogyWorkedExample',
        exampleId: 'we1',
        activityType: 'nature_study',
        scenario: 'Short scenario.',
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.activityType).toBe('nature_study');
    });

    it('truncates a long scenario at a word boundary with an ellipsis', () => {
      const word = 'lorem ';
      const longScenario = word.repeat(50).trim(); // 299 chars, well over 200
      const doc = baseDoc({
        _type: 'pedagogyWorkedExample',
        scenario: longScenario,
      });
      const meta = buildChunkMetadata(doc);
      const preview = meta.scenarioPreview as string;
      expect(preview.length).toBeLessThanOrEqual(201); // 200 chars + ellipsis char
      expect(preview.endsWith('…')).toBe(true);
      expect(preview.endsWith(' …')).toBe(false);
      // Word boundary: should not have split a word in half (chars before the ellipsis are whole words)
      const withoutEllipsis = preview.slice(0, -1);
      expect(longScenario.startsWith(withoutEllipsis)).toBe(true);
      expect(withoutEllipsis.endsWith(' ')).toBe(false);
    });

    it('passes a short scenario through unchanged (no truncation)', () => {
      const shortScenario = 'A short scenario under 200 characters.';
      const doc = baseDoc({
        _type: 'pedagogyWorkedExample',
        scenario: shortScenario,
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.scenarioPreview).toBe(shortScenario);
    });
  });

  describe('pedagogyFacilitationVocabulary', () => {
    it('carries verbSample (first 3) and verbCount', () => {
      const doc = baseDoc({
        _type: 'pedagogyFacilitationVocabulary',
        verbs: [
          { verb: 'narrate', meaning: 'tell back' },
          { verb: 'observe', meaning: 'watch closely' },
          { verb: 'wonder', meaning: 'ask open questions' },
          { verb: 'notice', meaning: 'draw attention to' },
        ],
      });
      const meta = buildChunkMetadata(doc);
      expect(meta.verbSample).toEqual(['narrate', 'observe', 'wonder']);
      expect(meta.verbCount).toBe(4);
    });

    it('omits verbSample/verbCount when verbs is absent or empty', () => {
      const docAbsent = baseDoc({ _type: 'pedagogyFacilitationVocabulary' });
      const metaAbsent = buildChunkMetadata(docAbsent);
      expect(metaAbsent.verbSample).toBeUndefined();
      expect(metaAbsent.verbCount).toBeUndefined();

      const docEmpty = baseDoc({ _type: 'pedagogyFacilitationVocabulary', verbs: [] });
      const metaEmpty = buildChunkMetadata(docEmpty);
      expect(metaEmpty.verbSample).toBeUndefined();
      expect(metaEmpty.verbCount).toBeUndefined();
    });
  });

  describe('resolvePedagogyKey (via pedagogyKey field on metadata)', () => {
    it('resolves from framework: { slug }', () => {
      const doc = baseDoc({ framework: { slug: 'charlotte_mason' } });
      const meta = buildChunkMetadata(doc);
      expect(meta.pedagogyKey).toBe('charlotte_mason');
    });

    it('resolves from framework: { _ref: "pedagogicalFramework.charlotte_mason" }', () => {
      const doc = baseDoc({ framework: { _ref: 'pedagogicalFramework.charlotte_mason' } });
      const meta = buildChunkMetadata(doc);
      expect(meta.pedagogyKey).toBe('charlotte_mason');
    });
  });
});
