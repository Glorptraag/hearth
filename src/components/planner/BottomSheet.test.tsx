/**
 * BottomSheet — the "Add to planner" sheet.
 *
 * Picking a Suggested or Browse-Library item must carry the item's moduleId
 * into onAdd. Without it the planner entry is title-only: ModuleCard can't
 * link to the runner, no plannerEntryId provenance reaches the log, and
 * planner_entry_created always reports has_module: false (G27).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import BottomSheet, { type PlannerSheetEntry } from './BottomSheet';

vi.mock('@/lib/analytics/posthog', () => ({
  track: vi.fn(),
  hashForAnalytics: vi.fn().mockResolvedValue('hashed_module_id_fixture_000'),
}));

const LIBRARY = [
  {
    title: 'Weather Station',
    moduleId: 'module-weather',
    sanityModuleId: 'module-weather',
    subjects: ['science', 'mathematics'],
  },
  {
    // Pack rows reuse `moduleId` for the pack id — must never reach the planner as a module.
    title: 'Nature Explorers Pack',
    moduleId: 'pack-nature',
    sanityModuleId: null,
    subjects: ['science'],
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(LIBRARY), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderSheet(recommendations: React.ComponentProps<typeof BottomSheet>['recommendations'] = []) {
  const onAdd = vi.fn(async (_entry: PlannerSheetEntry) => {});
  render(
    <BottomSheet
      isOpen
      targetDate="2026-10-22"
      targetSession="afternoon"
      learners={[{ id: 'learner-1', name: 'Ada', colourToken: 'rose' }]}
      recommendations={recommendations}
      onClose={vi.fn()}
      onAdd={onAdd}
    />,
  );
  return { onAdd };
}

function addButtonFor(title: string) {
  const row = screen.getByText(title).closest('div')!.parentElement!;
  return within(row).getByRole('button', { name: 'Add' });
}

describe('BottomSheet — onAdd payload', () => {
  it('carries the moduleId of a Suggested pick', async () => {
    const { onAdd } = renderSheet([
      { title: 'Try Weather Station next', reason: 'gap_fill', moduleId: 'module-weather' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Ada' }));
    fireEvent.click(addButtonFor('Try Weather Station next'));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith({
      date: '2026-10-22',
      title: 'Try Weather Station next',
      learnerIds: ['learner-1'],
      session: 'afternoon',
      moduleId: 'module-weather',
    });
  });

  it('carries the subject of a subject-gap suggestion that has no module', async () => {
    const { onAdd } = renderSheet([{ title: 'Explore Science', subject: 'science' }]);
    fireEvent.click(addButtonFor('Explore Science'));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    const payload = onAdd.mock.calls[0][0];
    expect(payload).not.toHaveProperty('moduleId');
    expect(payload.subjects).toEqual(['science']);
  });

  it('carries the moduleId and subjects of a Browse Library module', async () => {
    const { onAdd } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Browse Library' }));
    await screen.findByText('Weather Station');
    fireEvent.click(addButtonFor('Weather Station'));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith({
      date: '2026-10-22',
      title: 'Weather Station',
      learnerIds: [],
      session: 'afternoon',
      moduleId: 'module-weather',
      subjects: ['science', 'mathematics'],
    });
  });

  it('does not pass a pack id off as a moduleId', async () => {
    const { onAdd } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Browse Library' }));
    await screen.findByText('Nature Explorers Pack');
    fireEvent.click(addButtonFor('Nature Explorers Pack'));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).not.toHaveProperty('moduleId');
  });

  it('keeps Custom free-text entries title-only', async () => {
    const { onAdd } = renderSheet();
    fireEvent.change(screen.getByPlaceholderText('What are you planning?'), {
      target: { value: 'Library visit' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to planner' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(Object.keys(onAdd.mock.calls[0][0]).sort()).toEqual(['date', 'learnerIds', 'session', 'title']);
  });
});
