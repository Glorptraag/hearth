import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { EverydayWatchFor } from '@/lib/watch/everyday';
import WatchForCards from './WatchForCards';

const track = vi.fn();
vi.mock('@/lib/analytics/posthog', () => ({ track: (...args: unknown[]) => track(...args) }));

afterEach(() => {
  cleanup();
  track.mockClear();
});

const item = (over: Partial<EverydayWatchFor> = {}): EverydayWatchFor => ({
  learnerId: 'sam',
  learnerName: 'Sam Lee',
  colourToken: 'sage',
  dloId: 'dlo.M1.developing',
  threadId: 'M1',
  threadName: 'Number Sense',
  tier: 'developing',
  kind: 'does',
  reason: 'active-thread',
  lookFor: 'He counts each scoop once.',
  how: 'Afterwards, ask Sam to tell you how he counted.',
  siblingLines: ['Ivy already shows this.'],
  logHref: '/log?source=check-in&learner=sam&thread=M1',
  ...over,
});

describe('WatchForCards', () => {
  it('renders nothing when no child has a confirmed watch-for', () => {
    const { container } = render(<WatchForCards items={[]} />);
    expect(container.firstChild).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('renders one card per child: look-for, how, sibling lines and a check-in link', () => {
    render(<WatchForCards items={[item(), item({ learnerId: 'ivy', learnerName: 'Ivy', how: null, siblingLines: [], logHref: '/log?source=check-in&learner=ivy&thread=M1' })]} />);
    const section = screen.getByRole('region', { name: 'Watch for' });
    const cards = within(section).getAllByRole('listitem').filter((li) => li.parentElement?.parentElement === section);
    expect(cards).toHaveLength(2);

    const sam = cards[0];
    expect(within(sam).getByText('Sam')).toBeTruthy();
    expect(within(sam).getByText('Number Sense')).toBeTruthy();
    expect(within(sam).getByText('He counts each scoop once.')).toBeTruthy();
    expect(within(sam).getByText('Afterwards, ask Sam to tell you how he counted.')).toBeTruthy();
    expect(within(sam).getByText('Ivy already shows this.')).toBeTruthy();
    expect(within(sam).getByRole('link', { name: 'Log a moment for Sam in Number Sense' }).getAttribute('href')).toBe(
      '/log?source=check-in&learner=sam&thread=M1',
    );

    const ivy = cards[1];
    expect(within(ivy).queryByText(/Afterwards/)).toBeNull();
  });

  it('prefixes the base path on the Log it link', () => {
    render(<WatchForCards items={[item()]} basePath="/demo" />);
    expect(screen.getByRole('link', { name: /Log a moment for Sam/ }).getAttribute('href')).toBe(
      '/demo/log?source=check-in&learner=sam&thread=M1',
    );
  });

  it('records one watch_for_viewed per card', () => {
    render(<WatchForCards items={[item()]} />);
    expect(track).toHaveBeenCalledWith('watch_for_viewed', { scope: 'everyday', surface: 'dashboard', tier: 'developing' });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('keeps to plain Hearth voice', () => {
    const { container } = render(<WatchForCards items={[item()]} />);
    expect(container.textContent).not.toMatch(/\b(should|gap|behind|missing|AI)\b/i);
  });
});
