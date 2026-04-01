import { describe, it, expect } from 'vitest';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Date.now()}-allow`;
    const r1 = rateLimit(key, { limit: 3, windowMs: 10000 });
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(key, { limit: 3, windowMs: 10000 });
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(key, { limit: 3, windowMs: 10000 });
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests over the limit', () => {
    const key = `test-${Date.now()}-block`;
    rateLimit(key, { limit: 1, windowMs: 10000 });
    const r2 = rateLimit(key, { limit: 1, windowMs: 10000 });
    expect(r2.success).toBe(false);
    expect(r2.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `test-${Date.now()}-reset`;
    rateLimit(key, { limit: 1, windowMs: 50 });
    const r1 = rateLimit(key, { limit: 1, windowMs: 50 });
    expect(r1.success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const r2 = rateLimit(key, { limit: 1, windowMs: 50 });
    expect(r2.success).toBe(true);
  });

  it('uses default limit of 60', () => {
    const key = `test-${Date.now()}-default`;
    const r = rateLimit(key);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(59);
  });
});
