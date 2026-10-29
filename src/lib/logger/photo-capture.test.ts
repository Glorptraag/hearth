import { describe, expect, it } from 'vitest';
import { photoDateDefault, uploadFailureFor } from './photo-capture';

const NOW = new Date('2026-10-26T09:00:00');

describe('photoDateDefault', () => {
  it('uses the photo’s day when the parent has not picked a date', () => {
    expect(photoDateDefault('2026-10-20T14:05:33', null, NOW)).toBe('2026-10-20');
  });

  it('never overrides a date the parent chose', () => {
    expect(photoDateDefault('2026-10-20T14:05:33', '2026-10-25', NOW)).toBeNull();
  });

  it('leaves the form alone for today, the future, no date or a bad date', () => {
    expect(photoDateDefault('2026-10-26T08:00:00', null, NOW)).toBeNull();
    expect(photoDateDefault('2027-01-01T08:00:00', null, NOW)).toBeNull();
    expect(photoDateDefault(null, null, NOW)).toBeNull();
    expect(photoDateDefault('not a date', null, NOW)).toBeNull();
  });
});

describe('uploadFailureFor', () => {
  it('maps upload statuses onto parent-facing failure kinds', () => {
    expect(uploadFailureFor(413)).toBe('too-large');
    expect(uploadFailureFor(429)).toBe('rate-limited');
    expect(uploadFailureFor(503)).toBe('unavailable');
    expect(uploadFailureFor(500)).toBe('failed');
    expect(uploadFailureFor(400)).toBe('failed');
  });
});
