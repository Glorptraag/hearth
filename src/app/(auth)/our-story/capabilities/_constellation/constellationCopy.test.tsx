import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { THREAD_NAMES } from '@/lib/capability-threads';
import { ToastProvider } from '@/components/ui/Toast';
import { REPORT_HREF, constellationCopy, growingSentences } from './constellationCopy';
import { ConstellationRoute, growingSignals } from './ConstellationRoute';
import { ExploreView } from './ExploreView';
import { buildSnapshot, type ActiveThreadRow } from './topology';

// Same cold-import allowance as the other _constellation tests.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const BANNED = /\b(missing|behind|gaps?)\b/i;
const [T1, T2, T3] = Object.keys(THREAD_NAMES);
const learner = { id: 'lrn1', name: 'Emma', dateOfBirth: null, shapeIcon: null, colourToken: null };

function daysAgo(n: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function row(thread: string, overrides: Partial<ActiveThreadRow> = {}): ActiveThreadRow {
  return {
    thread_id: thread,
    thread_name: THREAD_NAMES[thread],
    observation_count: 1,
    suggested_tier: 'emerging',
    last_evidence_date: daysAgo(30),
    current_badge_level: null,
    next_badge: null,
    next_badge_progress: 0,
    ...overrides,
  };
}

describe('growingSentences — trajectory language, authored', () => {
  it('invites logging when nothing is lit yet', () => {
    expect(growingSentences('Emma', { lit: 0, recent: 0, newlyLit: 0, pickingUp: 0, opening: 0 })).toEqual([
      'Emma’s sky fills in as you log. Each moment lights the threads it touches.',
    ]);
  });

  it('names recent activity, newly lit, picking up and opening threads', () => {
    expect(growingSentences('Emma', { lit: 5, recent: 2, newlyLit: 1, pickingUp: 3, opening: 2 })).toEqual([
      'Emma has 5 threads lit, 2 of them active this week.',
      'One came on in the last fortnight.',
      '3 are picking up pace.',
      '2 threads are opening up — the threads they build on are lit, and they tend to come on of their own accord when the foundations settle.',
    ]);
  });

  it('reads well for one thread and for all-active', () => {
    expect(growingSentences('Emma', { lit: 1, recent: 1, newlyLit: 0, pickingUp: 0, opening: 0 })[0])
      .toBe('Emma has 1 thread lit, and it was active this week.');
    expect(growingSentences('Emma', { lit: 3, recent: 3, newlyLit: 0, pickingUp: 0, opening: 0 })[0])
      .toBe('Emma has 3 threads lit, all of them active this week.');
    expect(growingSentences('Emma', { lit: 1, recent: 0, newlyLit: 0, pickingUp: 0, opening: 0 })[0])
      .toBe('Emma has 1 thread lit. The next moment you log picks it up again.');
  });

  it('never claims evidence (no tier counts) and never uses deficit words', () => {
    const all = [
      ...growingSentences('Emma', { lit: 0, recent: 0, newlyLit: 0, pickingUp: 0, opening: 0 }),
      ...growingSentences('Emma', { lit: 4, recent: 0, newlyLit: 2, pickingUp: 1, opening: 1 }),
      ...growingSentences('Emma', { lit: 4, recent: 4, newlyLit: 0, pickingUp: 0, opening: 0 }),
    ];
    for (const s of all) {
      expect(s).not.toMatch(BANNED);
      expect(s).not.toMatch(/demonstrat|evidenc/i);
    }
  });

  it('keeps every static string free of deficit words', () => {
    const strings = Object.values(constellationCopy).map((v) => (typeof v === 'function' ? v('Emma') : v));
    for (const s of strings) expect(s).not.toMatch(BANNED);
  });
});

describe('growingSignals — reads only the snapshot’s existing signals', () => {
  it('counts recent, newly lit and accelerating (3+ observations) lit threads', () => {
    const now = new Date(2026, 9, 26);
    const snap = buildSnapshot(learner, [
      row(T1, { last_evidence_date: daysAgo(2, now), first_evidence_date: daysAgo(5, now), trajectory: 'accelerating', observation_count: 4 }),
      row(T2, { last_evidence_date: daysAgo(20, now), first_evidence_date: daysAgo(60, now), trajectory: 'accelerating', observation_count: 2 }),
      row(T3, { last_evidence_date: daysAgo(6, now), first_evidence_date: daysAgo(40, now), trajectory: 'plateau', observation_count: 9 }),
    ]);
    const s = growingSignals(snap, now);
    expect(s).toMatchObject({ lit: 3, recent: 2, newlyLit: 1, pickingUp: 1 });
    expect(s.opening).toBeGreaterThanOrEqual(0);
  });
});

describe('ConstellationRoute header and growing card', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ view: 'table' }) as ReturnType<typeof useSearchParams>);
  });

  function renderRoute(rows: ActiveThreadRow[]) {
    return render(
      <ToastProvider>
        <ConstellationRoute learners={[learner]} learnerId="lrn1" snap={buildSnapshot(learner, rows)} onSelectLearner={vi.fn()} />
      </ToastProvider>,
    );
  }

  it('says what is growing and points to the Report for what is evidenced', () => {
    renderRoute([row(T1, { last_evidence_date: daysAgo(1), first_evidence_date: daysAgo(3) })]);
    expect(screen.getByRole('heading', { level: 1, name: 'Emma’s constellation' })).toBeInTheDocument();
    expect(screen.getByText(constellationCopy.subtitle('Emma'))).toBeInTheDocument();
    const reportLinks = screen.getAllByRole('link', { name: 'Report' });
    expect(reportLinks[0]).toHaveAttribute('href', REPORT_HREF);
  });

  it('renders the growing card from recency and "New" signals, not tier counts', () => {
    renderRoute([row(T1, { last_evidence_date: daysAgo(1), first_evidence_date: daysAgo(3), suggested_tier: 'demonstrating' })]);
    expect(screen.getByText(constellationCopy.growingOverline)).toBeInTheDocument();
    expect(screen.getByText(/Emma has 1 thread lit, and it was active this week\. One came on in the last fortnight\./)).toBeInTheDocument();
    expect(screen.queryByText(/demonstrating \d+ of them/)).toBeNull();
  });
});

describe('Constellation panel overview copy', () => {
  it('keeps "Not yet observed" and points to the Report', () => {
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
    render(
      <ToastProvider>
        <ConstellationRoute learners={[learner]} learnerId="lrn1" snap={buildSnapshot(learner, [row(T1)])} onSelectLearner={vi.fn()} />
      </ToastProvider>,
    );
    const panel = screen.getByRole('complementary', { name: 'Constellation details' });
    expect(within(panel).getByText('Not yet observed')).toBeInTheDocument();
    expect(within(panel).getByText(new RegExp(constellationCopy.overviewGrowth))).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Report' })).toHaveAttribute('href', REPORT_HREF);
  });
});

describe('ExploreView copy', () => {
  it('drops "gap" and points to the Report from the activity section', () => {
    const snap = buildSnapshot(learner, []);
    const { container } = render(
      <ExploreView snap={snap} gapAnalysis={{ underserved_subjects: [], suggested_focus_threads: [] }} curriculumCoverage={{}} onDrillThread={vi.fn()} />,
    );
    expect(screen.getByText(constellationCopy.exploreIntro('Emma'))).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(BANNED);
    const activity = screen.getByRole('heading', { name: 'Activity by subject' }).parentElement!;
    expect(within(activity).getByRole('link', { name: 'Report' })).toHaveAttribute('href', REPORT_HREF);
  });
});
