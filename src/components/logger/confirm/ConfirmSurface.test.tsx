/**
 * ConfirmSurface — the post-save surface across its five states.
 *
 * Stubs `IntersectionObserver` (use-viewed-once constructs one), wraps in
 * `ToastProvider` (chip failures toast), and stubs `fetch` so chip taps can be
 * asserted against the confirm endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import type { BadgeReadyToast } from '@/lib/logger/badge-check';
import type { ConfirmBase, ConfirmState } from '@/lib/logger/confirm-state';
import { deriveProposals } from '@/lib/logger/proposals';
import type { AiEnrichment, DloEnrichmentItem } from '@/types/enrichment';

const trackMock = vi.fn();
vi.mock('@/lib/analytics/posthog', () => ({
  track: (...args: unknown[]) => trackMock(...args),
  hashForAnalytics: vi.fn().mockResolvedValue('hashed-entry'),
}));

import { ConfirmSurface } from './ConfirmSurface';
import { __resetWatchForCache } from './WatchForNext';
import { confirmCopy } from './confirmCopy';

const ada: LearnerRecord = { id: 'learner-ada', name: 'Ada', dateOfBirth: null, shapeIcon: null, colourToken: 'sage' };
const ben: LearnerRecord = { id: 'learner-ben', name: 'Ben', dateOfBirth: null, shapeIcon: null, colourToken: 'blue' };
const learners = [ada, ben];

const dlo = (dlo_id: string, confidence = 0.8): DloEnrichmentItem => ({ dlo_id, tier: 'developing', confidence });

function enriched(dlos: DloEnrichmentItem[], extra: Partial<AiEnrichment> = {}): AiEnrichment {
  return {
    status: 'enriched',
    capability_threads: [],
    per_child_signals: {},
    discrete_learning_objectives: dlos,
    ...extra,
  };
}

const base: ConfirmBase = {
  entryId: 'entry-1',
  savedAtMs: Date.now(),
  learnerIds: ['learner-ada'],
  evidenceCount: 0,
  source: { kind: 'logger' },
};

function proposalsState(
  enrichment: AiEnrichment,
  entryLearners: LearnerRecord[] = [ada],
  overrides: Partial<ConfirmBase> = {},
): ConfirmState {
  return {
    ...base,
    learnerIds: entryLearners.map((l) => l.id),
    ...overrides,
    kind: 'proposals',
    enrichment,
    proposals: deriveProposals(enrichment, entryLearners),
  };
}

const badge: BadgeReadyToast = {
  type: 'badge',
  message: 'Hearth noticed something new. Quick check?',
  action: { label: 'Now (2 min)', href: '/badges/assess/b1?learner=learner-ada&name=Ada' },
};

function wrap(ui: ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function surface(state: ConfirmState, props: Partial<Parameters<typeof ConfirmSurface>[0]> = {}) {
  return wrap(
    <ConfirmSurface
      state={state}
      learners={learners}
      frameworkTitle="Charlotte Mason"
      badgeReady={null}
      onLogAnother={() => {}}
      {...props}
    />,
  );
}

const ok = () => ({ ok: true, status: 200 }) as Response;
const bad = () => ({ ok: false, status: 500 }) as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  fetchMock = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal('fetch', fetchMock);
  trackMock.mockReset();
  __resetWatchForCache();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ConfirmSurface states', () => {
  it('queued: heading, sentence, exit row only', () => {
    surface({ kind: 'queued', learnerIds: ['learner-ada'] });
    expect(screen.getByRole('region', { name: confirmCopy.region })).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(confirmCopy.heading.queued);
    expect(screen.getByText(confirmCopy.sentence.queued)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: confirmCopy.done })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('button', { name: confirmCopy.logAnother })).toBeInTheDocument();
    expect(screen.queryByText(confirmCopy.attachLink)).not.toBeInTheDocument();
  });

  it('pending: heading, "Reading it now…", skeleton bars, exit row live', () => {
    const { container } = surface({ ...base, kind: 'pending' });
    expect(screen.getByRole('heading')).toHaveTextContent(confirmCopy.heading.pending);
    expect(screen.getByText(confirmCopy.sentence.pending)).toBeInTheDocument();
    expect(container.querySelectorAll('.hearth-skeleton')).toHaveLength(3);
    expect(screen.getByRole('button', { name: confirmCopy.logAnother })).toBeInTheDocument();
  });

  it('proposals: heading, grouped chips per child, helper line', () => {
    const state = proposalsState(
      enriched([dlo('dlo.M1.developing'), dlo('dlo.L3.emerging', 0.6)], {
        per_child_signals: {
          Ada: { engagement_score: 0.8, complexity_level: 'developing', notable: null },
          Ben: { engagement_score: 0.7, complexity_level: 'emerging', notable: null },
        },
      }),
      [ada, ben],
    );
    surface(state);
    expect(screen.getByRole('heading')).toHaveTextContent(confirmCopy.heading.proposals);
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName('Ada');
    expect(groups[1]).toHaveAccessibleName('Ben');
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4);
    expect(screen.getByText(confirmCopy.helper)).toBeInTheDocument();
  });

  it('nothing (single child): "It still counts." sentence', () => {
    surface({ ...base, kind: 'nothing', enrichment: enriched([]), nobodyNamed: false });
    expect(screen.getByRole('heading')).toHaveTextContent(confirmCopy.heading.nothing);
    expect(screen.getByText(confirmCopy.sentence.nothingSingle)).toBeInTheDocument();
  });

  it('nothing (multi, nobody named): names both children', () => {
    surface({
      ...base,
      learnerIds: ['learner-ada', 'learner-ben'],
      kind: 'nothing',
      enrichment: enriched([dlo('dlo.M1.developing')]),
      nobodyNamed: true,
    });
    expect(screen.getByText(confirmCopy.sentence.nobodyNamed('Ada and Ben'))).toBeInTheDocument();
  });

  it('nothing (multi, named but no usable proposals): still counts for both', () => {
    surface({
      ...base,
      learnerIds: ['learner-ada', 'learner-ben'],
      kind: 'nothing',
      enrichment: enriched([]),
      nobodyNamed: false,
    });
    expect(screen.getByText(confirmCopy.sentence.nothingMulti('Ada and Ben'))).toBeInTheDocument();
  });

  it('failed: sentence, Open Portfolio link, Read it again only with onRetryEnrichment', () => {
    const { unmount } = surface({ ...base, kind: 'failed' });
    expect(screen.getByRole('heading')).toHaveTextContent(confirmCopy.heading.failed);
    expect(screen.getByText(confirmCopy.sentence.failed)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: confirmCopy.openPortfolio })).toHaveAttribute(
      'href',
      '/our-story/portfolio',
    );
    expect(screen.queryByRole('button', { name: confirmCopy.readAgain })).not.toBeInTheDocument();
    unmount();

    const onRetryEnrichment = vi.fn();
    surface({ ...base, kind: 'failed' }, { onRetryEnrichment });
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readAgain }));
    expect(onRetryEnrichment).toHaveBeenCalledTimes(1);
  });

  it('focuses the heading on mount', () => {
    surface({ ...base, kind: 'pending' });
    expect(screen.getByRole('heading')).toHaveFocus();
  });

  it('shows the evidence pill only when evidenceCount > 0', () => {
    const { unmount } = surface({ ...base, kind: 'pending', evidenceCount: 2 });
    expect(screen.getByText(confirmCopy.evidence(2))).toBeInTheDocument();
    unmount();
    surface({ ...base, kind: 'pending' });
    expect(screen.queryByText(/piece/)).not.toBeInTheDocument();
  });
});

describe('ConfirmSurface chips', () => {
  it('tap POSTs confirm to the DLO endpoint, second tap POSTs dispute', async () => {
    surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    const chip = screen.getByRole('button', { pressed: false });
    expect(chip).toHaveTextContent('Number Sense · developing?');

    // A confirmed chip also asks for its "watch for next" line (W4.4), so the
    // confirm/dispute assertions are scoped to the DLO confirm endpoint.
    const confirmCalls = () =>
      fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/capabilities/'));

    await act(async () => {
      fireEvent.click(chip);
    });
    await waitFor(() => expect(confirmCalls()).toHaveLength(1));
    expect(confirmCalls()[0][0]).toBe('/api/capabilities/learner-ada/dlo/dlo.M1.developing/confirm');
    expect(JSON.parse(confirmCalls()[0][1].body)).toEqual({ action: 'confirm' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveTextContent('Number Sense · developing');
    expect(chip.textContent).not.toContain('?');

    await act(async () => {
      fireEvent.click(chip);
    });
    await waitFor(() => expect(confirmCalls()).toHaveLength(2));
    expect(JSON.parse(confirmCalls()[1][1].body)).toEqual({ action: 'dispute' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(fetchMock.mock.calls.filter(([url]) => !String(url).startsWith('/api/capabilities/'))).toEqual([
      ['/api/watch-for?learner=learner-ada&dlo=dlo.M1.developing'],
    ]);
  });

  it('reverts the chip and toasts when the confirm request fails', async () => {
    fetchMock.mockResolvedValue(bad());
    surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    const chip = screen.getByRole('button', { pressed: false });

    await act(async () => {
      fireEvent.click(chip);
    });

    await waitFor(() => expect(chip).toHaveAttribute('aria-pressed', 'false'));
    expect(await screen.findByText(confirmCopy.chipError)).toBeInTheDocument();
  });

  it('never renders a suppressed (H6) thread even when the enrichment carries one', () => {
    const enrichment = enriched([dlo('dlo.M1.developing'), dlo('dlo.H6.emerging', 0.9)]);
    const state = proposalsState(enrichment);
    expect(state.kind === 'proposals' && state.proposals.map((p) => p.threadId)).toEqual(['M1']);
    const { container } = surface(state);
    expect(container.textContent).not.toContain('Cultural Understanding');
    expect(container.textContent).not.toContain('H6');
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(1);
  });
});

describe('ConfirmSurface extras', () => {
  it('hides the attach link when attach is undefined, shows it when provided, static once linked', () => {
    const state = proposalsState(enriched([dlo('dlo.M1.developing')]));
    const { unmount } = surface(state);
    expect(screen.queryByText(confirmCopy.attachLink)).not.toBeInTheDocument();
    unmount();

    const onOpen = vi.fn();
    const second = surface(state, { attach: { onOpen, attachedTitle: null } });
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.attachLink }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    second.unmount();

    surface(state, { attach: { onOpen, attachedTitle: 'Rivers and Rain' } });
    expect(screen.getByText(confirmCopy.attached('Rivers and Rain'))).toBeInTheDocument();
    expect(screen.queryByText(confirmCopy.attachLink)).not.toBeInTheDocument();
  });

  it('renders the badge row (persistent) with its link when badgeReady is set', () => {
    surface({ ...base, kind: 'nothing', enrichment: enriched([]), nobodyNamed: false }, { badgeReady: badge });
    expect(screen.getByText(badge.message)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: confirmCopy.badgeAction })).toHaveAttribute('href', badge.action.href);
  });

  it('renders pedagogy attribution only when the enrichment has sources', () => {
    const without = surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    expect(screen.queryByText(/Grounded in/)).not.toBeInTheDocument();
    without.unmount();

    surface(
      proposalsState(
        enriched([dlo('dlo.M1.developing')], {
          pedagogy_sources: [{ id: 'pkb-1', layer: 'principle', pedagogyKey: 'charlotte_mason', metadata: {} }],
        }),
      ),
    );
    expect(screen.getByText('Grounded in Charlotte Mason')).toBeInTheDocument();
  });

  it('never renders model prose: no insight, observation, nudge, work sample or thread line', () => {
    const { container } = surface(
      proposalsState(
        enriched([dlo('dlo.M1.developing')], {
          insight_suggestions: ['INSIGHT_TEXT'],
          journey_observation: { text: 'OBSERVATION_TEXT', trigger: 'transfer' },
          work_sample: { flag: true, quality: 0.9 },
        }),
      ),
    );
    expect(container.textContent).not.toContain('INSIGHT_TEXT');
    expect(container.textContent).not.toContain('OBSERVATION_TEXT');
    expect(container.textContent).not.toMatch(/builds the/);
    expect(container.textContent).not.toMatch(/work sample/i);
  });

  it('contains no arrow glyph in any state', () => {
    const states: ConfirmState[] = [
      { kind: 'queued', learnerIds: ['learner-ada'] },
      { ...base, kind: 'pending' },
      proposalsState(enriched([dlo('dlo.M1.developing')])),
      { ...base, kind: 'nothing', enrichment: enriched([]), nobodyNamed: false },
      { ...base, kind: 'failed' },
    ];
    for (const state of states) {
      const { container, unmount } = surface(state, {
        badgeReady: badge,
        attach: { onOpen: () => {}, attachedTitle: null },
        onRetryEnrichment: () => {},
      });
      expect(container.textContent).not.toContain('→');
      unmount();
    }
  });
});

describe('ConfirmSurface Photo Read (W3.3)', () => {
  const READ = { draft: 'A child is writing numbers on a worksheet.', printedText: 'Math-U-See Alpha Lesson 12' };

  it('pending says "reading your photo" only when a photo is being read', () => {
    surface({ ...base, kind: 'pending', readingPhoto: true });
    expect(screen.getByText(confirmCopy.sentence.pendingPhoto)).toBeInTheDocument();
    expect(screen.queryByText(confirmCopy.sentence.pending)).not.toBeInTheDocument();
    cleanup();
    surface({ ...base, kind: 'pending' });
    expect(screen.getByText(confirmCopy.sentence.pending)).toBeInTheDocument();
  });

  it('shows the Read only as a labelled draft the parent can take, beside the chips', () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ suggestion: null, resources: [], current: null })));
    surface(proposalsState(enriched([dlo('dlo.M1.developing')]), [ada], { read: READ }));
    const draft = screen.getByRole('region', { name: confirmCopy.readDraft.label });
    expect(draft).toHaveTextContent(READ.draft);
    expect(screen.getByRole('button', { name: confirmCopy.readDraft.use })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: confirmCopy.readDraft.edit })).toBeInTheDocument();
    // The model sentence appears exactly once, and only inside the draft region.
    expect(screen.getAllByText(READ.draft)).toHaveLength(1);
  });

  it('renders the draft on a nothing-to-confirm save too', () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ suggestion: null, resources: [], current: null })));
    surface({ ...base, kind: 'nothing', enrichment: enriched([]), nobodyNamed: false, read: READ });
    expect(screen.getByRole('region', { name: confirmCopy.readDraft.label })).toBeInTheDocument();
  });

  it('asks about Working from when the photo had a printed header', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestion: { resourceId: 'shelfResource.math-u-see', title: 'Math-U-See', level: 'Alpha', lesson: '12' },
          resources: [{ id: 'shelfResource.math-u-see', title: 'Math-U-See', kind: 'curriculum', levels: ['Alpha'] }],
          current: null,
        }),
      ),
    );
    surface(proposalsState(enriched([]), [ada], { read: { draft: null, printedText: READ.printedText } }));
    expect(await screen.findByText(confirmCopy.workingFrom.prompt('Math-U-See Alpha · Lesson 12'))).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/entries/entry-1/working-from');
    expect(screen.queryByRole('region', { name: confirmCopy.readDraft.label })).not.toBeInTheDocument();
  });

  it('renders no Read UI without a Read, or before enrichment lands', () => {
    surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    expect(screen.queryByRole('region', { name: confirmCopy.readDraft.label })).not.toBeInTheDocument();
    cleanup();
    surface({ ...base, kind: 'pending', read: READ });
    expect(screen.queryByText(READ.draft)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the new copy inside the Logger v2 rules', () => {
    const copy = JSON.stringify({
      p: confirmCopy.sentence.pendingPhoto,
      r: confirmCopy.readDraft,
      w: confirmCopy.workingFrom,
      wp: confirmCopy.workingFrom.prompt('X'),
    }).toLowerCase();
    for (const word of ['try this', 'next time', 'should', 'sorry', 'insight', 'score', 'complete', '→']) {
      expect(copy).not.toContain(word);
    }
    expect(copy).not.toMatch(/\bai\b/);
  });
});

describe('ConfirmSurface watch-for (W4.4)', () => {
  const LINE = {
    dloId: 'dlo.M1.developing',
    learnerId: 'learner-ada',
    kind: 'does',
    lookFor: 'Counting may land on the right number without starting over.',
    how: 'Watch quietly, then ask Ada to tell you how they did it.',
  };

  function routeFetch(items: unknown[]) {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).startsWith('/api/watch-for') ? new Response(JSON.stringify({ items })) : ok(),
    );
  }

  it('renders the confirmed "watch for next" only under a confirmed chip', async () => {
    routeFetch([LINE]);
    surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    expect(screen.queryByText(LINE.lookFor)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { pressed: false }));
    });
    expect(await screen.findByText(LINE.lookFor)).toBeInTheDocument();
    expect(screen.getByText(LINE.how)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { pressed: true }));
    });
    await waitFor(() => expect(screen.queryByText(LINE.lookFor)).not.toBeInTheDocument());
  });

  it('renders nothing extra for a confirmed chip whose note is unconfirmed', async () => {
    routeFetch([]);
    surface(proposalsState(enriched([dlo('dlo.M1.developing')])));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { pressed: false }));
    });
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith('/api/watch-for'))).toBe(true),
    );
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('keeps the watch-for frame copy inside the Logger v2 rules', () => {
    const copy = `${confirmCopy.watchFor.overline('X')} ${confirmCopy.watchFor.label('X')}`.toLowerCase();
    for (const word of ['try this', 'next time', 'should', 'sorry', 'insight', 'score', 'complete', '→']) {
      expect(copy).not.toContain(word);
    }
    expect(copy).not.toMatch(/\bai\b/);
  });
});
