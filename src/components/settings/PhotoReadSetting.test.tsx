/**
 * Settings toggle for Photo Read consent (W3.2): reads and writes
 * /api/family/photo-read; a failed write reverts and says so.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhotoReadSetting } from './PhotoReadSetting';
import { photoReadCopy } from '@/components/logger/photoReadCopy';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('PhotoReadSetting', () => {
  it('shows the stored answer and turns it on with a PATCH', async () => {
    fetchMock
      .mockImplementationOnce(() => json({ optIn: false, readAvailable: true }))
      .mockImplementationOnce(() => json({ optIn: true, readAvailable: true }));
    render(<PhotoReadSetting />);

    const toggle = screen.getByRole('switch', { name: photoReadCopy.setting.label });
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/family/photo-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn: true }),
    });
  });

  it('notes an unanswered disclosure and that Read is not on yet', async () => {
    fetchMock.mockImplementationOnce(() => json({ optIn: null, readAvailable: false }));
    render(<PhotoReadSetting />);
    expect(await screen.findByText(photoReadCopy.setting.unanswered)).toBeInTheDocument();
    expect(screen.getByText(photoReadCopy.setting.notYetAvailable)).toBeInTheDocument();
  });

  it('reverts and says so when the write fails (e.g. a viewer)', async () => {
    fetchMock
      .mockImplementationOnce(() => json({ optIn: false, readAvailable: true }))
      .mockImplementationOnce(() => json({ error: 'Forbidden' }, 403));
    render(<PhotoReadSetting />);
    const toggle = screen.getByRole('switch', { name: photoReadCopy.setting.label });
    await waitFor(() => expect(toggle).not.toBeDisabled());

    fireEvent.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent(photoReadCopy.setting.saveFailed);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
