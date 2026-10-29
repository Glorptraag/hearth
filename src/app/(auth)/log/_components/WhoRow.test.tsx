/**
 * WhoRow — the "Who was learning?" chip picker.
 *
 * Toggle fires per chip; the fan-out note shows only at 2+ selected; the
 * failed state offers Try again; the empty state links to Settings.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WhoRow } from './WhoRow';
import { noticeCopy } from './noticeCopy';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

const learner = (id: string, name: string): LearnerRecord => ({
  id,
  name,
  dateOfBirth: null,
  shapeIcon: '●',
  colourToken: 'rose',
});

const learners = [learner('l1', 'Emma'), learner('l2', 'Noah')];

const renderWho = (props: Partial<Parameters<typeof WhoRow>[0]> = {}) => {
  const onToggle = vi.fn();
  const onReload = vi.fn();
  render(
    <WhoRow
      learners={learners}
      selected={[]}
      failed={false}
      onToggle={onToggle}
      onReload={onReload}
      {...props}
    />,
  );
  return { onToggle, onReload };
};

afterEach(cleanup);

describe('WhoRow', () => {
  it('toggles a child on tap and reflects selection via aria-pressed', () => {
    const { onToggle } = renderWho({ selected: ['l1'] });
    const emma = screen.getByRole('button', { name: /Emma/ });
    const noah = screen.getByRole('button', { name: /Noah/ });
    expect(emma).toHaveAttribute('aria-pressed', 'true');
    expect(noah).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(noah);
    expect(onToggle).toHaveBeenCalledWith('l2');
  });

  it('shows the age suffix when a date of birth is known', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 7);
    renderWho({ learners: [{ ...learner('l1', 'Emma'), dateOfBirth: dob.toISOString() }] });
    expect(screen.getByRole('button', { name: /Emma, 7/ })).toBeInTheDocument();
  });

  it('shows the multi-child note only once 2+ children are selected', () => {
    renderWho({ selected: ['l1'] });
    expect(screen.queryByText(noticeCopy.multiChildNote)).not.toBeInTheDocument();
    cleanup();
    renderWho({ selected: ['l1', 'l2'] });
    expect(screen.getByText(noticeCopy.multiChildNote)).toBeInTheDocument();
  });

  it('renders the failed state with Try again wired to onReload', () => {
    const { onReload } = renderWho({ failed: true, learners: [] });
    expect(screen.getByRole('alert')).toHaveTextContent(noticeCopy.learnersFailed);
    fireEvent.click(screen.getByRole('button', { name: noticeCopy.learnersRetry }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(noticeCopy.noLearners)).not.toBeInTheDocument();
  });

  it('renders the empty state linking to Settings when there are no children', () => {
    renderWho({ learners: [] });
    expect(screen.getByText(noticeCopy.noLearners)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: noticeCopy.noLearnersAction })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});
