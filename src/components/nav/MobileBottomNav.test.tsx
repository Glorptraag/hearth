import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { MobileBottomNav } from './MobileBottomNav';

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseRouter = vi.mocked(useRouter);

const push = vi.fn();

beforeEach(() => {
  push.mockClear();
  mockedUsePathname.mockReturnValue('/dashboard');
  mockedUseRouter.mockReturnValue({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  });
});

function setup() {
  return render(<MobileBottomNav />);
}

describe('MobileBottomNav', () => {
  it('renders the five tabs in order: Home, Story, Log, Plan, Explore', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const labels = Array.from(nav.querySelectorAll('span')).map((s) => s.textContent?.trim());
    // Labels appear interleaved with icon spans; assert order of the visible names.
    const expected = ['Home', 'Story', 'Log', 'Plan', 'Explore'];
    expected.forEach((name, i) => {
      const idx = labels.indexOf(name);
      expect(idx).toBeGreaterThanOrEqual(0);
      if (i > 0) {
        expect(idx).toBeGreaterThan(labels.indexOf(expected[i - 1]));
      }
    });
  });

  it('Home and Story are direct links; Plan and Explore are buttons that open menus', () => {
    setup();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Story/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plan menu/i })).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.getByRole('button', { name: /Explore menu/i })).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('Log button is a link to /log', () => {
    setup();
    const log = screen.getByRole('link', { name: /Log a moment/i });
    expect(log).toHaveAttribute('href', '/log');
  });

  it('opens the Plan tray on tap and reflects aria-expanded', () => {
    setup();
    const planTab = screen.getByRole('button', { name: /Plan menu/i });
    expect(planTab).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(planTab);
    expect(planTab).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('Explore tray contains 3 menuitems when opened', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Explore menu/i }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('tapping the same trayed tab again starts closing the tray', () => {
    setup();
    const planTab = screen.getByRole('button', { name: /Plan menu/i });
    fireEvent.click(planTab);
    expect(planTab).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(planTab);
    // The ring's open visual goes away as soon as we enter 'closing'.
    expect(planTab).toHaveAttribute('aria-expanded', 'false');
  });

  it('tapping a different trayed tab swaps which tray is shown', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Plan menu/i }));
    // Plan tray's first row is Badge Creator (top, indexFromBottom=2).
    expect(screen.getByRole('menuitem', { name: /Badge Creator/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Explore menu/i }));
    expect(screen.queryByRole('menuitem', { name: /Badge Creator/i })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Capabilities/i })).toBeInTheDocument();
  });

  it('Escape closes an open tray', () => {
    setup();
    const planTab = screen.getByRole('button', { name: /Plan menu/i });
    fireEvent.click(planTab);
    expect(planTab).toHaveAttribute('aria-expanded', 'true');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(planTab).toHaveAttribute('aria-expanded', 'false');
  });

  it('selecting a tray row calls router.push and closes the tray', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Plan menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Weekly Planner/i }));
    expect(push).toHaveBeenCalledWith('/planner');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('focuses the bottom row (closest to thumb) when the tray opens', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Plan menu/i }));
    // Plan: bottom row is "Weekly Planner" (last destination in config).
    const bottomRow = screen.getByRole('menuitem', { name: /Weekly Planner/i });
    expect(document.activeElement).toBe(bottomRow);
  });

  it('clears the tray when the pathname changes', () => {
    const { rerender } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Plan menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    mockedUsePathname.mockReturnValue('/planner');
    rerender(<MobileBottomNav />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks Home as aria-current="page" when on /dashboard', () => {
    mockedUsePathname.mockReturnValue('/dashboard');
    setup();
    const home = screen.getByRole('link', { name: /Home/i });
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('marks Story as aria-current="page" anywhere under /our-story', () => {
    mockedUsePathname.mockReturnValue('/our-story/capabilities');
    setup();
    const story = screen.getByRole('link', { name: /Story/i });
    expect(story).toHaveAttribute('aria-current', 'page');
  });
});
