/**
 * WorkingFromChip (W3.3, D-LP-6): confirm, change or no. working_from is
 * written only on the parent's confirm; "No" writes nothing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WorkingFromChip } from './WorkingFromChip';
import { confirmCopy } from './confirmCopy';

afterEach(cleanup);

const RESOURCES = [
  { id: 'shelfResource.math-u-see', title: 'Math-U-See', kind: 'curriculum', levels: ['Primer', 'Alpha', 'Beta'] },
  { id: 'shelfResource.my-own-plan', title: 'My own plan', kind: 'universal', levels: [] },
];
const SUGGESTION = { resourceId: 'shelfResource.math-u-see', title: 'Math-U-See', level: 'Alpha', lesson: '12' };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function setup(get: unknown = { suggestion: SUGGESTION, resources: RESOURCES, current: null }) {
  const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      const { workingFrom } = JSON.parse(init.body as string);
      return json({ workingFrom });
    }
    return json(get);
  });
  const onError = vi.fn();
  render(<WorkingFromChip entryId="entry-1" onError={onError} fetchImpl={fetchImpl as unknown as typeof fetch} />);
  return { fetchImpl, onError };
}

function patches(fetchImpl: ReturnType<typeof vi.fn>) {
  return fetchImpl.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === 'PATCH')
    .map(([, init]) => JSON.parse((init as RequestInit).body as string).workingFrom);
}

describe('WorkingFromChip', () => {
  it('asks "Working from: {resource} · Lesson {n}?" from the server’s match', async () => {
    setup();
    expect(await screen.findByText(confirmCopy.workingFrom.prompt('Math-U-See Alpha · Lesson 12'))).toBeInTheDocument();
  });

  it('Yes writes the match with read provenance and shows it confirmed', async () => {
    const { fetchImpl } = setup();
    fireEvent.click(await screen.findByRole('button', { name: confirmCopy.workingFrom.yes }));
    expect(await screen.findByText(confirmCopy.workingFrom.confirmed('Math-U-See Alpha · Lesson 12'))).toBeInTheDocument();
    expect(patches(fetchImpl)).toEqual([
      { resourceId: 'shelfResource.math-u-see', level: 'Alpha', lesson: '12', source: 'read' },
    ]);
  });

  it('No hides the chip and writes nothing', async () => {
    const { fetchImpl } = setup();
    fireEvent.click(await screen.findByRole('button', { name: confirmCopy.workingFrom.no }));
    expect(screen.queryByText(/Working from/)).not.toBeInTheDocument();
    expect(patches(fetchImpl)).toEqual([]);
  });

  it('Change lets the parent pick from the Shelf, saved as parent provenance', async () => {
    const { fetchImpl } = setup();
    fireEvent.click(await screen.findByRole('button', { name: confirmCopy.workingFrom.change }));
    fireEvent.change(screen.getByLabelText(confirmCopy.workingFrom.resourceLabel), {
      target: { value: 'shelfResource.my-own-plan' },
    });
    expect(screen.queryByLabelText(confirmCopy.workingFrom.lessonLabel)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.workingFrom.save }));
    expect(await screen.findByText(confirmCopy.workingFrom.confirmed('My own plan'))).toBeInTheDocument();
    expect(patches(fetchImpl)).toEqual([{ resourceId: 'shelfResource.my-own-plan', source: 'parent' }]);
  });

  it('Change keeps a level and lesson the parent corrects', async () => {
    const { fetchImpl } = setup();
    fireEvent.click(await screen.findByRole('button', { name: confirmCopy.workingFrom.change }));
    fireEvent.change(screen.getByLabelText(confirmCopy.workingFrom.levelLabel), { target: { value: 'Beta' } });
    fireEvent.change(screen.getByLabelText(confirmCopy.workingFrom.lessonLabel), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.workingFrom.save }));
    await waitFor(() =>
      expect(patches(fetchImpl)).toEqual([
        { resourceId: 'shelfResource.math-u-see', level: 'Beta', lesson: '3', source: 'parent' },
      ]),
    );
  });

  it('shows an already-confirmed choice without asking again', async () => {
    setup({
      suggestion: SUGGESTION,
      resources: RESOURCES,
      current: { resourceId: 'shelfResource.my-own-plan', source: 'parent' },
    });
    expect(await screen.findByText(confirmCopy.workingFrom.confirmed('My own plan'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: confirmCopy.workingFrom.yes })).not.toBeInTheDocument();
  });

  it('renders nothing when the photo matched nothing on the Shelf', async () => {
    const { fetchImpl } = setup({ suggestion: null, resources: RESOURCES, current: null });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    expect(screen.queryByText(/Working from/)).not.toBeInTheDocument();
  });

  it('a failed save reports the error and keeps asking', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH' ? json({}, 500) : json({ suggestion: SUGGESTION, resources: RESOURCES, current: null }),
    );
    const onError = vi.fn();
    render(<WorkingFromChip entryId="entry-1" onError={onError} fetchImpl={fetchImpl as unknown as typeof fetch} />);
    fireEvent.click(await screen.findByRole('button', { name: confirmCopy.workingFrom.yes }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(confirmCopy.workingFrom.error));
    expect(screen.getByRole('button', { name: confirmCopy.workingFrom.yes })).toBeEnabled();
  });
});
