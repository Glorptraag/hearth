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

function renderCard(entry = baseEntry, isReadOnly = false) {
  const onToggle = vi.fn();
  const onDelete = vi.fn();
  render(
    <ModuleCard
      entry={entry}
      learners={[]}
      isReadOnly={isReadOnly}
      onToggle={onToggle}
      onDelete={onDelete}
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

  it('read-only cards cannot toggle', () => {
    const { onToggle } = renderCard(baseEntry, true);
    fireEvent.click(screen.getByRole('button', { name: /Mark "Weather Station" complete/ }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  /**
   * Remove button accessibility (WCAG 2.2 SC 2.5.8 Target Size (Minimum), and
   * keyboard reachability). It used to be a 16px `hidden`/`group-hover:flex`
   * corner button: under the AA 24px bar, and `display:none` drops an element
   * out of the tab order entirely, so a keyboard user could never reach it.
   */
  describe('remove button', () => {
    it('meets the 24px minimum target size', () => {
      renderCard();
      const remove = screen.getByRole('button', { name: 'Remove' });
      // Tailwind arbitrary sizing — jsdom does no layout, so assert the class
      // contract rather than a measured box.
      expect(remove.className).toMatch(/h-\[26px\]/);
      expect(remove.className).toMatch(/w-\[26px\]/);
    });

    it('stays in the tab order and reveals itself on focus, hover and touch', () => {
      renderCard();
      const remove = screen.getByRole('button', { name: 'Remove' });
      // `hidden` would make it unfocusable; opacity keeps it reachable.
      expect(remove.className).not.toMatch(/(^|\s)hidden(\s|$)/);
      expect(remove.className).toMatch(/focus-visible:opacity-100/);
      expect(remove.className).toMatch(/group-hover:opacity-100/);
      expect(remove.className).toMatch(/pointer-coarse:opacity-100/);
    });

    it('does not carry hit-target, which would overlap the indicator dots', () => {
      renderCard();
      const remove = screen.getByRole('button', { name: 'Remove' });
      expect(remove.className).not.toMatch(/hit-target/);
    });

    it('sits in flow beside the indicators, not absolutely positioned', () => {
      renderCard();
      const remove = screen.getByRole('button', { name: 'Remove' });
      expect(remove.className).not.toMatch(/absolute/);
    });

    it('deletes the entry when clicked', () => {
      const { onDelete } = renderCard();
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
      expect(onDelete).toHaveBeenCalledWith('plan-1');
    });

    it('is absent on read-only cards', () => {
      renderCard(baseEntry, true);
      expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    });
  });
});
