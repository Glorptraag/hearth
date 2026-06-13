import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/Toast';
import WorkSampleCuration from './WorkSampleCuration';

// Minimal Entry shape the component reads.
function entry(over: Partial<Parameters<typeof WorkSampleCuration>[0]['entries'][number]> = {}) {
  return {
    id: 'e1',
    title: 'Marble run',
    dateOccurred: '2026-03-10', // month 3 → within an "early" (Jan–Jun) slot
    subjects: ['english'],
    evidenceUrls: null,
    description: 'Wrote a recount of the marble run',
    workSampleCandidate: true,
    workSampleQuality: 0.8,
    source: 'logger',
    aiEnrichment: null,
    ...over,
  };
}

const slot = {
  id: 1,
  area: 'english',
  areaLabel: 'Writing',
  label: 'Early Writing',
  timing: 'Term 1 · Jan–Jun 2026',
  termHalf: 'early' as const,
};

function renderCuration(over: Partial<Parameters<typeof WorkSampleCuration>[0]> = {}) {
  const onSampleChanged = vi.fn();
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <WorkSampleCuration
        reportId="r1"
        slot={slot}
        reportYear={2026}
        sample={{ id: 's1', reportId: 'r1', slot: 'early_writing', entryId: null, status: 'empty', annotation: null }}
        learnerName="Emma"
        reportingBody="Home Education Unit"
        entries={[entry()]}
        onSampleChanged={onSampleChanged}
        onClose={onClose}
        {...over}
      />
    </ToastProvider>,
  );
  return { onSampleChanged, onClose };
}

describe('WorkSampleCuration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('surfaces a 409 conflict and stays on the candidate list (no false annotate)', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'This entry is already assigned to the "early_maths" slot. Remove it there first.' }),
    });
    const { onSampleChanged } = renderCuration();

    fireEvent.click(screen.getByText('Marble run').closest('button')!);

    // The server's conflict message is shown to the user…
    expect(await screen.findByText(/already assigned to the "early_maths" slot/i)).toBeInTheDocument();
    // …and the false success path never ran.
    expect(onSampleChanged).not.toHaveBeenCalled();
    // Still on the candidate list (no annotation textarea has appeared).
    expect(screen.queryByPlaceholderText(/Describe what you saw/i)).toBeNull();
  });

  it('transitions to annotate on a successful (200) select', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 's1', slot: 'early_writing', entryId: 'e1', status: 'selected' }),
    });
    const { onSampleChanged } = renderCuration();

    fireEvent.click(screen.getByText('Marble run').closest('button')!);

    await waitFor(() => expect(onSampleChanged).toHaveBeenCalledTimes(1));
  });

  it('browse-all reveals out-of-window entries with a warning, still selectable (escape hatch)', async () => {
    // The only entry is out of the slot window (Sept → not in a Jan–Jun "early"
    // slot), so the default candidate list is empty.
    const outOfWindow = entry({ id: 'e2', title: 'Spring poem', dateOccurred: '2026-09-10' });
    renderCuration({ entries: [outOfWindow] });

    // Thin-candidate banner is shown; the out-of-window entry is hidden by default.
    expect(screen.getByText(/Only 0 entries match this slot/i)).toBeInTheDocument();
    expect(screen.queryByText('Spring poem')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Browse all entries/i }));

    // Now it appears, flagged as outside the window but still a real button.
    expect(screen.getByText('Spring poem')).toBeInTheDocument();
    expect(screen.getByText(/Outside window/i)).toBeInTheDocument();
    expect(screen.getByText('Spring poem').closest('button')).not.toBeNull();
  });
});
