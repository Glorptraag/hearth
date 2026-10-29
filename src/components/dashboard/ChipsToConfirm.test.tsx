import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ChipsToConfirmEntry } from '@/lib/dashboard/chips-to-confirm';
import type { Proposal } from '@/lib/logger/proposals';
import ChipsToConfirm from './ChipsToConfirm';

vi.mock('@/lib/analytics/posthog', () => ({ track: vi.fn() }));

afterEach(cleanup);

const proposal = (learnerId: string, learnerName: string, dloId = 'dlo.M1.emerging'): Proposal => ({
  key: `${learnerId}:${dloId}`,
  learnerId,
  learnerName,
  colourToken: 'sage',
  dloId,
  threadId: dloId.split('.')[1],
  threadName: 'Number Sense',
  tier: 'emerging',
  confidence: 0.8,
});

const entries: ChipsToConfirmEntry[] = [
  {
    entryId: 'e1',
    title: 'Baking scones',
    dateOccurred: '2026-10-25',
    proposals: [proposal('sam', 'Sam'), proposal('ivy', 'Ivy')],
  },
];

describe('ChipsToConfirm', () => {
  it('renders nothing when there is nothing to confirm', () => {
    const { container } = render(<ChipsToConfirm entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows each moment with its chips grouped per child and a Portfolio link', () => {
    render(<ChipsToConfirm entries={entries} />);
    expect(screen.getByRole('region', { name: 'To confirm' })).toBeTruthy();
    expect(screen.getByText('Baking scones')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Sam' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Ivy' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open in Portfolio/ }).getAttribute('href')).toBe('/our-story/portfolio#entry-e1');
  });

  it('a tap confirms through the shared confirm seam', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true } as Response);
    render(<ChipsToConfirm entries={entries} fetchImpl={fetchImpl as unknown as typeof fetch} />);
    const chip = screen.getByRole('button', { name: /Sam, Number Sense, emerging — tap to confirm/ });
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/capabilities/sam/dlo/dlo.M1.emerging/confirm',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'confirm' }) }),
    );
    await waitFor(() => expect(chip.getAttribute('aria-pressed')).toBe('true'));
  });

  it('a failed confirm reverts and says so', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    render(<ChipsToConfirm entries={entries} fetchImpl={fetchImpl as unknown as typeof fetch} />);
    const chip = screen.getByRole('button', { name: /Ivy, Number Sense/ });
    await act(async () => {
      fireEvent.click(chip);
    });
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Couldn’t save that/));
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });
});
