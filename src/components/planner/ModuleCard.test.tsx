/**
 * ModuleCard — planner→runner affordance split.
 *
 * A module-backed planner card's TITLE opens the runner (carrying
 * plannerEntryId provenance) while the status DOT stays the complete-toggle;
 * free-text entries (no moduleId) keep the title as the toggle since they have
 * nowhere to navigate. Guards the fix for the planner dead-end where cards
 * could only toggle status and offered no path into the module.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ModuleCard from './ModuleCard';

afterEach(cleanup);

const baseEntry = {
  id: 'plan-1',
  title: 'Weather Station',
  status: 'planned',
  moduleId: 'mod-weather' as string | null,
  learnerIds: [],
  subjects: ['science'],
};

function renderCard(entry = baseEntry, isReadOnly = false, onRequestMove?: () => void) {
  const onToggle = vi.fn();
  const onDelete = vi.fn();
  render(
    <ModuleCard
      entry={entry}
      learners={[]}
      isReadOnly={isReadOnly}
      onToggle={onToggle}
      onDelete={onDelete}
      onRequestMove={onRequestMove}
    />,
  );
  return { onToggle, onDelete };
}

describe('ModuleCard', () => {
  it('title links to the runner with planner provenance when a module backs the entry', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /Weather Station/ });
    expect(link.getAttribute('href')).toBe('/module/mod-weather?plannerEntryId=plan-1');
  });

  it('the status dot toggles without navigating', () => {
    const { onToggle } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Mark "Weather Station" complete/ }));
    expect(onToggle).toHaveBeenCalledWith('plan-1', 'planned');
  });

  it('a free-text entry (no moduleId) keeps the title as the toggle', () => {
    const { onToggle } = renderCard({ ...baseEntry, moduleId: null });
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Weather Station' }));
    expect(onToggle).toHaveBeenCalledWith('plan-1', 'planned');
  });

  // HTML5 drag never fires on touch, so the move button is the only way a
  // phone can move an entry — it must be a real, always-present button rather
  // than a hover-only affordance.
  it('exposes a move button that requests the day/session picker', () => {
    const onRequestMove = vi.fn();
    renderCard(baseEntry, false, onRequestMove);
    fireEvent.click(screen.getByRole('button', { name: /Move "Weather Station"/ }));
    expect(onRequestMove).toHaveBeenCalledWith('plan-1');
  });

  it('read-only cards offer no move button', () => {
    renderCard(baseEntry, true, vi.fn());
    expect(screen.queryByRole('button', { name: /Move "Weather Station"/ })).toBeNull();
  });

  it('read-only cards cannot toggle', () => {
    const { onToggle } = renderCard(baseEntry, true);
    fireEvent.click(screen.getByRole('button', { name: /Mark "Weather Station" complete/ }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
