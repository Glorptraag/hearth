import { describe, it, expect } from 'vitest';
import {
  getPedagogyVocabulary,
  adaptGreeting,
  adaptNotificationCopy,
  adaptGapMessage,
  adaptCelebration,
} from './adapter';
import { PEDAGOGIES } from '@/types';
import {
  PHILOSOPHIES,
  VALID_PHILOSOPHY_IDS,
  getPhilosophyInsight,
  getValuesInsight,
  getPracticesInsight,
  generateSynthesis,
} from '@/components/pedagogy/data';

describe('getPedagogyVocabulary', () => {
  it('returns eclectic vocabulary by default', () => {
    const vocab = getPedagogyVocabulary('eclectic');
    expect(vocab.sessionNoun).toBe('session');
    expect(vocab.facilitatorNoun).toBe('parent');
    expect(vocab.greetingTone).toBe('warm');
  });

  it('returns montessori vocabulary', () => {
    const vocab = getPedagogyVocabulary('montessori');
    expect(vocab.sessionNoun).toBe('work cycle');
    expect(vocab.facilitatorNoun).toBe('guide');
    expect(vocab.learnerNoun).toBe('child');
  });

  it('falls back to eclectic for unknown pedagogy', () => {
    const vocab = getPedagogyVocabulary('unknown_pedagogy');
    expect(vocab.sessionNoun).toBe('session');
  });
});

describe('adaptGreeting', () => {
  it('produces a morning greeting for eclectic', () => {
    const greeting = adaptGreeting('eclectic', ['Zara'], { timeOfDay: 'morning' });
    expect(greeting).toContain('Zara');
    expect(greeting).toContain('morning');
  });

  it('produces a structured evening greeting for classical', () => {
    const greeting = adaptGreeting('classical', ['Leo'], { timeOfDay: 'evening' });
    expect(greeting).toContain('practised');
  });

  it('handles empty child names', () => {
    const greeting = adaptGreeting('eclectic', [], { timeOfDay: 'afternoon' });
    expect(greeting).toContain('your learners');
  });
});

describe('adaptNotificationCopy', () => {
  it('returns log_invitation copy', () => {
    const result = adaptNotificationCopy('eclectic', 'log_invitation', {});
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.body).toBeTruthy();
  });

  it('returns streak_prompt copy for montessori', () => {
    const result = adaptNotificationCopy('montessori', 'streak_prompt', {});
    expect(result!.title).toContain('work cycle');
  });

  it('returns null for unknown type', () => {
    const result = adaptNotificationCopy('eclectic', 'unknown_type', {});
    expect(result).toBeNull();
  });
});

describe('adaptGapMessage', () => {
  it('formats a gap message with vocabulary', () => {
    const msg = adaptGapMessage('unschooling', 'Science');
    expect(msg).toContain('Science');
    expect(msg).toContain('curiosity');
  });
});

describe('adaptCelebration', () => {
  it('formats a celebration message', () => {
    const msg = adaptCelebration('eclectic', { entryCount: 5, subjectCount: 3 });
    expect(msg).toContain('5 sessions');
    expect(msg).toContain('3 areas');
  });

  it('handles singular correctly', () => {
    const msg = adaptCelebration('eclectic', { entryCount: 1, subjectCount: 1 });
    expect(msg).toContain('1 session');
    expect(msg).toContain('1 area');
  });
});

// ─── PedagogyWizard → adapter contract ───
// Guards the handoff between the onboarding/settings wizard (which writes
// pedagogyPreference / pedagogyValues / pedagogyPractices) and the adapter
// that consumes `pedagogy` everywhere. If catalogs drift out of sync these
// tests fail.

describe('wizard → adapter contract', () => {
  it('every wizard philosophy id maps to a Pedagogy union member', () => {
    for (const id of VALID_PHILOSOPHY_IDS) {
      expect(PEDAGOGIES).toContain(id);
    }
  });

  it('every Pedagogy union member has a wizard philosophy card', () => {
    for (const p of PEDAGOGIES) {
      expect(VALID_PHILOSOPHY_IDS).toContain(p);
    }
  });

  it('every wizard philosophy id resolves to real vocabulary (no silent fallback)', () => {
    for (const philosophy of VALID_PHILOSOPHY_IDS) {
      const vocab = getPedagogyVocabulary(philosophy);
      const eclecticVocab = getPedagogyVocabulary('eclectic');
      if (philosophy !== 'eclectic') {
        // Anything other than eclectic should have its own sessionNoun.
        expect(vocab.sessionNoun).not.toBe(eclecticVocab.sessionNoun);
      }
    }
  });

  it('every wizard philosophy id has its own demo insight', () => {
    for (const philosophy of VALID_PHILOSOPHY_IDS) {
      const insight = getPhilosophyInsight(philosophy);
      expect(insight.title).not.toContain('Select a philosophy');
      expect(insight.content.length).toBeGreaterThan(20);
    }
  });

  it('wizard philosophy cards carry name + tagline + key elements', () => {
    for (const p of PHILOSOPHIES) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.tagline.length).toBeGreaterThan(0);
      expect(p.keyElements.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('generateSynthesis embeds philosophy name when philosophy selected', () => {
    const synthesis = generateSynthesis('charlotte_mason', ['nature', 'whole-child'], ['narration']);
    expect(synthesis).toContain('Charlotte Mason');
    expect(synthesis).toContain('nature connection');
  });

  it('generateSynthesis handles no-philosophy gracefully', () => {
    const synthesis = generateSynthesis(null, [], []);
    expect(synthesis.toLowerCase()).toContain('complete your selections');
  });

  it('values insight reveals specific statements for chosen value ids', () => {
    const insight = getValuesInsight(['child-led', 'nature']);
    expect(insight.content.toLowerCase()).toContain('child-led');
    expect(insight.content.toLowerCase()).toContain('nature');
  });

  it('practices insight returns at most 3 suggestions', () => {
    const insight = getPracticesInsight([
      'nature-journaling',
      'narration',
      'living-books',
      'documentation',
      'hands-on',
    ]);
    // Each suggestion is a sentence ending in '.'; count matches.
    const sentences = insight.content.split('. ').filter(Boolean);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });
});
