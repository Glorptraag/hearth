import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountDelete from './AccountDelete';

const fetchMock = vi.fn();

function json(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);
}

function mockPreview(preview: unknown) {
  fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
    init?.method === 'POST' ? json({ deleted: true }) : json(preview),
  );
}

async function openDialog() {
  render(<AccountDelete />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
  return screen.findByRole('dialog');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AccountDelete: sole owner', () => {
  it('shows the full-delete warning and no transfer step', async () => {
    mockPreview({ outcome: 'family_deleted', hearthsHandedOver: 1, hearthsDeleted: 2 });
    const dialog = await openDialog();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('account-delete-title');
    expect(await screen.findByText(/only adult in this family/i)).toBeTruthy();
    expect(screen.queryByText(/hand over your family first/i)).toBeNull();
    expect(screen.getByText(/1 Hearth your family created will pass/i)).toBeTruthy();
    expect(screen.getByText(/2 Hearths your family created has no other active/i)).toBeTruthy();
  });

  it('only enables the confirm button once the phrase is typed, then posts it', async () => {
    mockPreview({ outcome: 'family_deleted', hearthsHandedOver: 0, hearthsDeleted: 0 });
    await openDialog();
    const confirm = (await screen.findByRole('button', { name: 'Permanently delete' })) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(confirm.className).toContain('bg-red-600');
    expect(confirm.className).toContain('text-white');

    fireEvent.change(screen.getByPlaceholderText('DELETE MY ACCOUNT'), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(post![1].body)).toEqual({ confirmation: 'DELETE MY ACCOUNT' });
    });
  });
});

describe('AccountDelete: transfer path', () => {
  const preview = {
    outcome: 'ownership_transferred',
    successor: { email: 'sam@example.com', role: 'editor' },
    hearthsHandedOver: 0,
    hearthsDeleted: 0,
  };

  it('shows the transfer step first, naming the new owner and what stays', async () => {
    mockPreview(preview);
    await openDialog();
    expect(await screen.findByRole('heading', { name: /hand over your family first/i })).toBeTruthy();
    expect(screen.getByText('sam@example.com')).toBeTruthy();
    expect(screen.getByText(/Hearths your family created stay with the family/i)).toBeTruthy();
    // The destructive confirm is not reachable yet.
    expect(screen.queryByRole('button', { name: /hand over and delete/i })).toBeNull();
    expect(screen.queryByPlaceholderText('DELETE MY ACCOUNT')).toBeNull();
  });

  it('continues to the typed confirmation, then posts', async () => {
    mockPreview(preview);
    await openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    const confirm = screen.getByRole('button', { name: /hand over and delete my account/i }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('DELETE MY ACCOUNT'), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true),
    );
  });
});

describe('AccountDelete: error paths', () => {
  it('shows the server error and keeps the dialog open when delete fails', async () => {
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? json({ error: 'Too many requests' }, false, 429)
        : json({ outcome: 'family_deleted', hearthsHandedOver: 0, hearthsDeleted: 0 }),
    );
    await openDialog();
    await screen.findByRole('button', { name: 'Permanently delete' });
    fireEvent.change(screen.getByPlaceholderText('DELETE MY ACCOUNT'), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Too many requests');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('does not offer deletion when the preview fails, and retries on request', async () => {
    fetchMock.mockImplementationOnce(() => json({ error: 'boom' }, false, 500));
    await openDialog();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Nothing has changed/);
    expect(screen.queryByRole('button', { name: /delete/i, hidden: false })?.textContent).not.toMatch(/permanently/i);

    mockPreview({ outcome: 'family_deleted', hearthsHandedOver: 0, hearthsDeleted: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Permanently delete' })).toBeTruthy();
  });

  it('closes on Cancel', async () => {
    mockPreview({ outcome: 'family_deleted', hearthsHandedOver: 0, hearthsDeleted: 0 });
    await openDialog();
    await screen.findByRole('button', { name: 'Permanently delete' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
