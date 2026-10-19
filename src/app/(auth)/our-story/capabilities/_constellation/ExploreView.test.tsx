import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { THREAD_NAMES, getThreadName } from '@/lib/capability-threads';
import { ExploreView } from './ExploreView';
import { buildSnapshot } from './topology';

// The cold import of the capability-universe graph module can take well over
// vitest's default 5000ms per-test timeout (90-150s on a cold cache) — bump
// it for this file so `npm test` (no --testTimeout flag) stays green.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const THREAD_ID = Object.keys(THREAD_NAMES)[0];

const snap = buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, []);

describe('ExploreView (Explore / gap lens)', () => {
  it('renders quiet threads as drillable chips (honestly labelled) and an underserved subject', () => {
    const onDrillThread = vi.fn();
    render(
      <ExploreView
        snap={snap}
        gapAnalysis={{ underserved_subjects: ['science'], suggested_focus_threads: [THREAD_ID] }}
        curriculumCoverage={{ english: { total_entries: 4, unique_descriptors: 3, coverage_percentage: 20 } }}
        onDrillThread={onDrillThread}
      />,
    );
    const chip = screen.getByRole('button', { name: getThreadName(THREAD_ID) });
    fireEvent.click(chip);
    expect(onDrillThread).toHaveBeenCalledWith(THREAD_ID);
    // Underserved subject surfaces in its own section (it also appears in the
    // activity list below, hence getAllByText).
    expect(screen.getByText('Gone quiet lately')).toBeInTheDocument();
    expect(screen.queryByText('Suggested threads')).toBeNull();
    expect(screen.getByText('Lighter subjects lately')).toBeInTheDocument();
    expect(screen.getAllByText('Science').length).toBeGreaterThanOrEqual(1);
  });

  it('filters out suggested threads that are not in the topology (no dead chips)', () => {
    render(
      <ExploreView
        snap={snap}
        gapAnalysis={{ underserved_subjects: [], suggested_focus_threads: ['NOT_A_REAL_THREAD'] }}
        curriculumCoverage={{}}
        onDrillThread={vi.fn()}
      />,
    );
    expect(screen.queryByText('Gone quiet lately')).toBeNull();
  });

  it('renders an activity progressbar for every subject', () => {
    render(
      <ExploreView
        snap={snap}
        gapAnalysis={{ underserved_subjects: [], suggested_focus_threads: [] }}
        curriculumCoverage={{ english: { total_entries: 4, unique_descriptors: 3, coverage_percentage: 20 } }}
        onDrillThread={vi.fn()}
      />,
    );
    // One per canonical subject (8).
    expect(screen.getAllByRole('progressbar')).toHaveLength(8);
    // English has 4 moments → "Strong" per subjectActivityLabel.
    expect(screen.getByText(/Strong/)).toBeInTheDocument();
  });

  it('shows a gentle pre-log message when nothing is logged and no gaps', () => {
    render(
      <ExploreView
        snap={snap}
        gapAnalysis={{ underserved_subjects: [], suggested_focus_threads: [] }}
        curriculumCoverage={{}}
        onDrillThread={vi.fn()}
      />,
    );
    expect(screen.getByText(/Once you start logging/)).toBeInTheDocument();
  });
});
