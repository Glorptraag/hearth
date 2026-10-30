import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Proposal } from '@/lib/logger/proposals';
import { ProposalChip } from './ProposalChip';
import { confirmCopy } from './confirmCopy';

const proposal: Proposal = {
  key: 'learner-ada:dlo.M1.developing',
  learnerId: 'learner-ada',
  learnerName: 'Ada',
  colourToken: 'sage',
  dloId: 'dlo.M1.developing',
  threadId: 'M1',
  threadName: 'Number Sense',
  tier: 'developing',
  confidence: 0.8,
};

afterEach(cleanup);

describe('ProposalChip', () => {
  it('renders a proposed chip with aria-pressed=false and a trailing question mark', () => {
    render(<ProposalChip proposal={proposal} confirmed={false} busy={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveTextContent('Number Sense · developing?');
    expect(btn).toHaveAttribute('aria-label', confirmCopy.chipAria('Ada', 'Number Sense', 'developing', false));
    expect(btn).not.toHaveAttribute('aria-busy');
  });

  it('drops the question mark and sets aria-pressed=true once confirmed', () => {
    render(<ProposalChip proposal={proposal} confirmed busy={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent('Number Sense · developing');
    expect(btn.textContent).not.toContain('?');
    expect(btn).toHaveAttribute('aria-label', confirmCopy.chipAria('Ada', 'Number Sense', 'developing', true));
  });

  it('marks an in-flight chip aria-busy and dims it', () => {
    render(<ProposalChip proposal={proposal} confirmed={false} busy onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.className).toContain('opacity-60');
  });

  it('passes the proposal to onToggle on tap', () => {
    const onToggle = vi.fn();
    render(<ProposalChip proposal={proposal} confirmed={false} busy={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(proposal);
  });
});
