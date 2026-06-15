/**
 * WhoSection — multi-child fan-out affordance (UX compendium UC-L-03).
 *
 * Guards the replacement of the inert "Learning together" checkbox with an
 * explanatory note: a multi-child entry already fans out into per-child
 * portfolio records, and the note makes that legible at capture time. Asserts
 * the note shows only at 2+ children and the dead checkbox is gone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WhoSection } from './WhoSection';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

vi.mock('@/components/logger/WatchForTodayStrip', () => ({
  WatchForTodayStrip: () => null,
}));
vi.mock('./SectionHeader', () => ({
  SectionHeader: ({ label }: { label: string }) => <h2>{label}</h2>,
}));

const learner = (id: string, name: string): LearnerRecord => ({
  id,
  name,
  dateOfBirth: null,
  shapeIcon: '●',
  colourToken: 'rose',
});

const learners = [learner('l1', 'Emma'), learner('l2', 'Noah')];

const renderWho = (selectedLearners: string[]) =>
  render(
    <WhoSection
      learners={learners}
      selectedLearners={selectedLearners}
      onToggleLearner={vi.fn()}
      snapshotData={null}
      done={false}
    />,
  );

afterEach(cleanup);

describe('WhoSection fan-out affordance', () => {
  it('shows the per-child fan-out note once 2+ children are selected', () => {
    renderWho(['l1', 'l2']);
    expect(screen.getByText(/saved to each child/i)).toBeInTheDocument();
  });

  it('hides the note when only one child is selected', () => {
    renderWho(['l1']);
    expect(screen.queryByText(/saved to each child/i)).not.toBeInTheDocument();
  });

  it('no longer renders the inert "Learning together" checkbox', () => {
    renderWho(['l1', 'l2']);
    expect(screen.queryByText(/learning together/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
