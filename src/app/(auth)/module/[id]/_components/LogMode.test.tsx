import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import LogMode from './LogMode';
import type { Module, QuickCaptureItem } from './types';

/**
 * Regression coverage for the module-runner finish flow.
 *
 * The "Finish & Log →" path must reach LogMode with the session's completed
 * activities and quick captures intact, so `sourceActivityIds` is derived and
 * sent to /api/entries (which drives the activity→capability-thread linking).
 * The session reset now runs via `onSaved` AFTER a successful POST, never
 * before LogMode mounts.
 */

const buildModule = (): Module => ({
  _id: 'module_1',
  title: 'Tide Pools',
  targetUnderstanding: 'Rock pools host distinct living communities.',
  subjects: ['science'],
  approaches: [
    {
      _id: 'approach_1',
      title: 'Hands-on',
      modality: 'kinesthetic',
      activities: [
        { _id: 'activity_a', title: 'Observe' },
        { _id: 'activity_b', title: 'Sketch' },
        { _id: 'activity_c', title: 'Discuss' },
      ],
    },
  ],
});

/**
 * Stub `fetch` for LogMode's mount reads (/api/learners, GET /api/entries) and
 * capture the body of the POST /api/entries save.
 */
const stubFetch = (postOk = true) => {
  const posted: { body: Record<string, unknown> | null } = { body: null };
  const okJson = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/learners') {
      return okJson([{ id: 'learner_1', name: 'Sam' }]);
    }
    if (url.startsWith('/api/entries') && init?.method !== 'POST') {
      return okJson([]);
    }
    if (url === '/api/entries' && init?.method === 'POST') {
      posted.body = JSON.parse(init.body as string);
      return okJson({ id: 'entry_1' }, postOk ? 201 : 500);
    }
    throw new Error(`Unhandled fetch: ${init?.method ?? 'GET'} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { posted };
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const clickSave = async () => {
  const button = await screen.findByRole('button', { name: /Save to Portfolio/i });
  // Mount effect auto-selects the first learner, which enables the button.
  await waitFor(() => expect(button).not.toBeDisabled());
  button.click();
};

describe('LogMode save flow — sourceActivityIds', () => {
  it('sends sourceActivityIds when activities were completed and captured', async () => {
    const { posted } = stubFetch();
    const onSaved = vi.fn();
    const quickCaptures: QuickCaptureItem[] = [
      {
        type: 'note',
        content: 'Found a crab',
        activityIdx: 2,
        activityTitle: 'Discuss',
        activityId: 'activity_c',
        timestamp: 1,
      },
    ];

    render(
      <LogMode
        module={buildModule()}
        selectedApproachIdx={0}
        completedActivityIdxs={[0, 1]}
        quickCaptures={quickCaptures}
        onSaved={onSaved}
      />,
    );

    await clickSave();

    await waitFor(() => expect(posted.body).not.toBeNull());
    // Captures are collected before completed step indexes; order preserved.
    expect(posted.body!.sourceActivityIds).toEqual(['activity_c', 'activity_a', 'activity_b']);
    expect(posted.body!.sourceApproachId).toBe('approach_1');
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('omits sourceActivityIds when nothing was completed or captured', async () => {
    const { posted } = stubFetch();
    const onSaved = vi.fn();

    render(
      <LogMode
        module={buildModule()}
        selectedApproachIdx={0}
        completedActivityIdxs={[]}
        quickCaptures={[]}
        onSaved={onSaved}
      />,
    );

    await clickSave();

    await waitFor(() => expect(posted.body).not.toBeNull());
    expect(posted.body).not.toHaveProperty('sourceActivityIds');
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('does not reset the session when the save fails', async () => {
    const { posted } = stubFetch(false);
    const onSaved = vi.fn();

    render(
      <LogMode
        module={buildModule()}
        selectedApproachIdx={0}
        completedActivityIdxs={[0]}
        quickCaptures={[]}
        onSaved={onSaved}
      />,
    );

    await clickSave();

    await waitFor(() => expect(posted.body).not.toBeNull());
    // onSaved (the session reset) only fires on a successful POST.
    expect(onSaved).not.toHaveBeenCalled();
  });
});
