import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Boundary itself doesn't touch the db / Clerk, but the @/components/icons
// surface re-exports from a heavy package. Mock the few it uses so the
// import doesn't fan out.
vi.mock('@/components/icons', () => ({
  Lifebuoy: () => null,
}));
vi.mock('@/components/ui/EmptyState', () => ({
  default: ({ heading, body }: { heading: string; body: string }) => (
    <div data-testid="empty-state">
      <h1>{heading}</h1>
      <p>{body}</p>
    </div>
  ),
}));
// Boundary fires `await import('@sentry/nextjs')` — give it something fast.
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import AuthError from './error';

describe('(auth)/error.tsx', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs error.digest so server-side throws are joinable to user reports', () => {
    const err = Object.assign(new Error('boom'), { digest: 'd-12345' });
    render(<AuthError error={err} reset={() => {}} />);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('digest=d-12345'),
      err
    );
  });

  it('falls back to "n/a" when no digest present (eg. client-only throw)', () => {
    const err = new Error('client boom');
    render(<AuthError error={err} reset={() => {}} />);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('digest=n/a'),
      err
    );
  });

  it('renders the EmptyState fallback UI', () => {
    const err = Object.assign(new Error('x'), { digest: 'd-1' });
    const { getByTestId } = render(<AuthError error={err} reset={() => {}} />);

    expect(getByTestId('empty-state')).toBeDefined();
  });
});
