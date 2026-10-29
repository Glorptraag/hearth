import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import DashboardClient from './DashboardClient';

vi.mock('@/lib/analytics/posthog', () => ({ track: vi.fn() }));
vi.mock('@/components/ui/JurisdictionBanner', () => ({ JurisdictionBanner: () => null }));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const base: ComponentProps<typeof DashboardClient> = {
  familyName: 'Lee Family',
  snapshot: {},
  recentEntries: [
    {
      id: 'e1',
      title: 'Baking scones',
      description: null,
      dateOccurred: '2026-10-20',
      subjects: null,
      learnerIds: ['sam'],
      source: 'logger',
    },
  ],
  todayPlanner: [],
  learners: [{ id: 'sam', name: 'Sam', colourToken: 'sage', shapeIcon: null, dateOfBirth: null }],
  todayEntryCount: 0,
  noticed: [
    { learnerId: 'sam', learnerName: 'Sam', insight: { id: 'i1', kind: 'notable', text: 'Sam counted the scones.', date: '2026-10-20' } },
  ],
};

describe('DashboardClient — W5.3 sections', () => {
  it('without a watch-for or chips, shows neither section and keeps Hearth noticed', () => {
    render(<DashboardClient {...base} />);
    expect(screen.queryByRole('region', { name: 'Watch for' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'To confirm' })).toBeNull();
    expect(screen.getByRole('region', { name: /Hearth noticed/ })).toBeTruthy();
  });

  it('renders the watch-for and to-confirm sections when there is something to show', () => {
    render(
      <DashboardClient
        {...base}
        watchFors={[
          {
            learnerId: 'sam',
            learnerName: 'Sam',
            colourToken: 'sage',
            dloId: 'dlo.M1.developing',
            threadId: 'M1',
            threadName: 'Number Sense',
            tier: 'developing',
            kind: 'does',
            reason: 'noticed',
            lookFor: 'He counts each scoop once.',
            how: null,
            siblingLines: [],
            logHref: '/log?source=check-in&learner=sam&thread=M1',
          },
        ]}
        chipsToConfirm={[
          {
            entryId: 'e1',
            title: 'Baking scones',
            dateOccurred: '2026-10-20',
            proposals: [
              {
                key: 'sam:dlo.M1.emerging',
                learnerId: 'sam',
                learnerName: 'Sam',
                colourToken: 'sage',
                dloId: 'dlo.M1.emerging',
                threadId: 'M1',
                threadName: 'Number Sense',
                tier: 'emerging',
                confidence: 0.8,
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole('region', { name: 'Watch for' })).toBeTruthy();
    expect(screen.getByText('He counts each scoop once.')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'To confirm' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /tap to confirm/ })).toBeTruthy();
  });

  it('recent moments open the moment in Portfolio', () => {
    render(<DashboardClient {...base} />);
    const card = screen.getByTestId('moment-card');
    expect(card.getAttribute('href')).toBe('/our-story/portfolio#entry-e1');
  });
});
