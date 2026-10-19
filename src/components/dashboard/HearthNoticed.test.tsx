import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import HearthNoticed, { collectNoticed, relativeDay } from './HearthNoticed';
import type { SnapshotInsight } from '@/types/snapshot';

afterEach(cleanup);

const insight = (id: string, date: string, extra: Partial<SnapshotInsight> = {}): SnapshotInsight => ({
  id, kind: 'journey', text: `Text for ${id}`, date, ...extra,
});

describe('collectNoticed', () => {
  it('interleaves children newest-first and caps the list', () => {
    const items = collectNoticed([
      { id: 'a', name: 'Ada Lee', insights: [insight('a1', '2026-10-01'), insight('a2', '2026-10-05')] },
      { id: 'b', name: 'Ben Lee', insights: [insight('b1', '2026-10-03')] },
      { id: 'c', name: 'Cy', insights: undefined },
    ], 2);
    expect(items.map((i) => i.insight.id)).toEqual(['a2', 'b1']);
    expect(items[1].learnerName).toBe('Ben Lee');
  });
});

describe('HearthNoticed', () => {
  it('renders nothing with no items', () => {
    const { container } = render(<HearthNoticed items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the child, a kind caption, the text, and a thread deep-link', () => {
    render(
      <HearthNoticed
        items={[
          { learnerId: 'a', learnerName: 'Ada Lee', insight: insight('j1', '2026-10-05', { trigger: 'transfer' }) },
          { learnerId: 'a', learnerName: 'Ada Lee', insight: insight('t1', '2026-10-04', { kind: 'thread_lit', thread_id: 'M6', text: 'A new thread lit up for Ada: Spatial Reasoning.' }) },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: /hearth noticed/i })).toBeTruthy();
    expect(screen.getByText('Carrying learning across')).toBeTruthy();
    expect(screen.getByText('New thread')).toBeTruthy();
    expect(screen.getByText('Text for j1')).toBeTruthy();
    const threadLink = screen.getByRole('link', { name: /open the thread/i }) as HTMLAnchorElement;
    expect(threadLink.getAttribute('href')).toBe('/our-story/capabilities?view=table&d=3&focus=M6');
    expect(screen.getByRole('link', { name: /open ada’s page/i }).getAttribute('href')).toBe('/our-story/learner/a');
  });

  it('relativeDay reads naturally', () => {
    const now = new Date('2026-10-06T12:00:00');
    expect(relativeDay('2026-10-06', now)).toBe('today');
    expect(relativeDay('2026-10-05', now)).toBe('yesterday');
    expect(relativeDay('2026-10-02', now)).toBe('4 days ago');
    expect(relativeDay('2026-09-20', now)).toBe('2w ago');
  });
});
