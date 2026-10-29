/**
 * ReadDraftRow (W3.3, A1): the Photo Read draft is labelled as a draft and
 * becomes the moment's words only when the parent takes it, as is or edited.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReadDraftRow } from './ReadDraftRow';
import { confirmCopy } from './confirmCopy';

afterEach(cleanup);

const DRAFT = 'A child is writing numbers on a worksheet.';

function renderRow(fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }))) {
  const onError = vi.fn();
  render(<ReadDraftRow entryId="entry-1" draft={DRAFT} onError={onError} fetchImpl={fetchImpl as typeof fetch} />);
  return { fetchImpl, onError };
}

function sentText(fetchImpl: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse((fetchImpl.mock.calls[call][1] as RequestInit).body as string).text;
}

describe('ReadDraftRow', () => {
  it('shows the draft under an explicit draft label, writing nothing yet', () => {
    const { fetchImpl } = renderRow();
    expect(screen.getByRole('region', { name: confirmCopy.readDraft.label })).toHaveTextContent(DRAFT);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('"Use this" PATCHes the draft and confirms it was added', async () => {
    const { fetchImpl } = renderRow();
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.use }));
    await screen.findByText(confirmCopy.readDraft.accepted);
    expect(fetchImpl).toHaveBeenCalledWith('/api/entries/entry-1/read-draft', expect.objectContaining({ method: 'PATCH' }));
    expect(sentText(fetchImpl)).toBe(DRAFT);
    expect(screen.queryByRole('button', { name: confirmCopy.readDraft.use })).not.toBeInTheDocument();
  });

  it('"Edit" lets the parent change the words before taking them', async () => {
    const { fetchImpl } = renderRow();
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.edit }));
    const box = screen.getByLabelText(confirmCopy.readDraft.editLabel);
    expect(box).toHaveValue(DRAFT);
    fireEvent.change(box, { target: { value: 'Sam did Lesson 12 by himself.' } });
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.saveEdited }));
    await screen.findByText('Sam did Lesson 12 by himself.');
    expect(sentText(fetchImpl)).toBe('Sam did Lesson 12 by himself.');
  });

  it('cancelling an edit writes nothing and restores the draft', () => {
    const { fetchImpl } = renderRow();
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.edit }));
    fireEvent.change(screen.getByLabelText(confirmCopy.readDraft.editLabel), { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.cancel }));
    expect(screen.getByText(DRAFT)).toBeInTheDocument();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a failed save keeps the draft offered and reports the error', async () => {
    const { onError } = renderRow(vi.fn(async () => new Response('{}', { status: 409 })));
    fireEvent.click(screen.getByRole('button', { name: confirmCopy.readDraft.use }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(confirmCopy.readDraft.error));
    expect(screen.getByRole('button', { name: confirmCopy.readDraft.use })).toBeEnabled();
    expect(screen.queryByText(confirmCopy.readDraft.accepted)).not.toBeInTheDocument();
  });
});
