import { describe, it, expect } from 'vitest';
import {
  getPedagogyVocabulary,
  adaptGreeting,
  adaptNotificationCopy,
  adaptGapMessage,
  adaptCelebration,
} from './adapter';

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
