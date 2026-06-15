/**
 * CompletenessRing — readiness, not a grade (UX compendium UC-L-13).
 *
 * The ring is wayfinding: once the entry is saveable it shows a ✓ and reads
 * "Ready to save" to assistive tech; while still being built it shows the
 * climbing number. Guards that the raw percentage never becomes the headline
 * once the parent is allowed to leave.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CompletenessRing } from './SectionHeader';

afterEach(cleanup);

describe('CompletenessRing', () => {
  it('exposes an accessible progressbar with the readiness phrase, not a bare number', () => {
    render(<CompletenessRing score={35} valueText="Add an observation" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '35');
    expect(bar).toHaveAttribute('aria-valuetext', 'Add an observation');
  });

  it('shows the climbing number while the entry is not yet saveable', () => {
    render(<CompletenessRing score={42} ready={false} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('replaces the number with a ready signal once saveable', () => {
    render(<CompletenessRing score={60} ready valueText="Ready to save" />);
    // The grade-like number is gone once the parent is allowed to leave.
    expect(screen.queryByText('60')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Ready to save');
  });
});
