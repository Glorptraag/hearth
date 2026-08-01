/**
 * MoveSheet — the touch/keyboard path for moving a planner entry.
 *
 * HTML5 drag-and-drop does not fire on touch devices, so without this picker a
 * phone cannot move an entry between days or sessions at all. These tests guard
 * the contract the grid relies on: picking calls onMove with the grid's own
 * date key, past days are refused, and re-picking the current cell is a no-op
 * rather than a wasted PATCH.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import MoveSheet, { type MoveTargetDay } from './MoveSheet';

afterEach(cleanup);

const days: MoveTargetDay[] = [
  { date: '2026-08-03', label: 'Mon', dayNumber: 3, isPast: true },
  { date: '2026-08-04', label: 'Tue', dayNumber: 4, isPast: false },
  { date: '2026-08-05', label: 'Wed', dayNumber: 5, isPast: false },
];

const entry = {
  id: 'plan-1',
  title: 'Weather Station',
  date: '2026-08-04',
  session: 'morning',
};

function renderSheet(overrides: Partial<React.ComponentProps<typeof MoveSheet>> = {}) {
  const onMove = vi.fn();
  const onClose = vi.fn();
  render(
    <MoveSheet
      isOpen
      entry={entry}
      days={days}
      onMove={onMove}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onMove, onClose };
}

describe('MoveSheet', () => {
  it('moves to the picked day and session, then closes', () => {
    const { onMove, onClose } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /Afternoon, Wed 5/ }));
    expect(onMove).toHaveBeenCalledWith('plan-1', '2026-08-05', 'afternoon');
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the entry’s current cell and does not re-PATCH it', () => {
    const { onMove, onClose } = renderSheet();
    const current = screen.getByRole('button', { name: /Morning, Tue 4 — current/ });
    expect(current.getAttribute('aria-current')).toBe('true');
    fireEvent.click(current);
    expect(onMove).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses past days, matching the grid’s drop rule', () => {
    const { onMove } = renderSheet();
    const past = screen.getByRole('button', { name: /Morning, Mon 3/ }) as HTMLButtonElement;
    expect(past.disabled).toBe(true);
    fireEvent.click(past);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('is a labelled modal dialog', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Move to...')).toBeTruthy();
    expect(screen.getByText('Weather Station')).toBeTruthy();
  });

  it('closes on Escape', () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
