import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandedCardBody } from './page';

// A complete entry; individual tests override aiEnrichment / workSampleCandidate.
const baseEntry = {
  id: 'e1',
  title: 'Marble run',
  description: 'Built and tested a marble run',
  dateOccurred: '2026-03-10',
  subjects: ['science'],
  learnerIds: ['l1'],
  engagementPerLearner: null,
  discoveriesPerLearner: null,
  evidenceUrls: null,
  evidence: null,
  aiEnrichment: { status: 'enriched' as const },
  workSampleCandidate: false,
  status: 'complete',
  createdAt: '2026-03-10T00:00:00.000Z',
  source: 'logger',
  sourceModuleId: null,
};

function renderBody(entryOver: Record<string, unknown> = {}) {
  const onRetryEnrichment = vi.fn();
  const onToggleWorkSample = vi.fn();
  render(
    <ExpandedCardBody
      entry={{ ...baseEntry, ...entryOver }}
      learners={[]}
      entriesFetchedAtMs={Date.parse('2026-03-11T00:00:00.000Z')}
      editing={false}
      onEdit={vi.fn()}
      onCancelEdit={vi.fn()}
      onSaved={vi.fn()}
      onRetryEnrichment={onRetryEnrichment}
      onToggleWorkSample={onToggleWorkSample}
    />,
  );
  return { onRetryEnrichment, onToggleWorkSample };
}

describe('ExpandedCardBody (shared Thread/Timeline body)', () => {
  it('shows "Generate now" recovery on a failed enrichment and calls onRetryEnrichment', () => {
    const { onRetryEnrichment } = renderBody({ aiEnrichment: { status: 'failed', error: 'boom' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate now/i }));
    expect(onRetryEnrichment).toHaveBeenCalledTimes(1);
  });

  it('renders the journey-observation callout when present', () => {
    renderBody({
      aiEnrichment: {
        status: 'enriched',
        journey_observation: { text: 'Applied counting to a real shopping problem', trigger: 'transfer' },
      },
    });
    expect(screen.getByText('Applied counting to a real shopping problem')).toBeInTheDocument();
  });

  it('renders a functional work-sample toggle that reflects state and fires the handler', () => {
    const { onToggleWorkSample } = renderBody({ workSampleCandidate: false });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as work sample' }));
    expect(onToggleWorkSample).toHaveBeenCalledTimes(1);
  });

  it('labels the toggle "Work sample" once flagged', () => {
    renderBody({ workSampleCandidate: true });
    expect(screen.getByRole('button', { name: 'Work sample' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as work sample' })).toBeNull();
  });
});
