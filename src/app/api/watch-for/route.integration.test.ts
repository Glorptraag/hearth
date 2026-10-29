/**
 * INTEGRATION: GET /api/watch-for (W4.4; D-HC-5, D-LP-8).
 *
 * Real DB (family, learner, pedagogy setting), Sanity mocked. Pins that the
 * Sanity reads are gated on the confirmation fields, that an unconfirmed note
 * is omitted even if one slipped through, that the child's age and the
 * family's tradition shape the how line, and the family boundary.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { subYears, format } from 'date-fns';
import { asSignedOut, asUser } from '@/test/clerk-helpers';

const { sanityFetch } = vi.hoisted(() => ({ sanityFetch: vi.fn() }));
vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: vi.fn(async () => []) },
  sanityServerClient: { fetch: sanityFetch },
}));

import { db } from '@/lib/db';
import { familySettings } from '@/lib/db/schema';
import { createFamily, createLearner } from '@/test/db-factories';
import { FRAMEWORK_WATCH_HOW_QUERY, WATCH_FOR_NOTES_QUERY } from '@/lib/sanity/queries';
import { GET } from './route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';

const CONFIRMED = '2026-10-23T10:00:00Z';

const NOTES = [
  {
    dloId: 'dlo.M1.developing',
    watchForNext: { neutral: 'Counting may land on the right number without starting over.' },
    evidenceKind: 'says',
    watchForConfirmedAt: CONFIRMED,
  },
  {
    // Defence in depth: the GROQ gate should never return this, but if it did
    // the composer still omits it.
    dloId: 'dlo.L2.developing',
    watchForNext: { neutral: 'An unconfirmed draft line.' },
    evidenceKind: 'does',
    watchForConfirmedAt: null,
  },
];

const WALDORF = {
  slug: 'waldorf_steiner',
  watchHow: {
    does: 'Do it alongside {child} in a rhythm — clap, step or sing each one.',
    says: 'Tell it as a story first; listen for what they say back later.',
  },
  watchHowStageOverrides: [{ stage: 'first', kind: 'says', text: "Don't ask for explanation. Notice if it turns up in their play." }],
  watchHowConfirmedAt: CONFIRMED,
};

function get(query: string) {
  return GET(new NextRequest(`http://x/api/watch-for?${query}`));
}

function sanityReturns(notes: unknown, framework: unknown) {
  sanityFetch.mockImplementation(async (q: string) => (q === WATCH_FOR_NOTES_QUERY ? notes : framework));
}

async function seed(pedagogy: string, ageYears: number) {
  asUser({});
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  await db.insert(familySettings).values({ familyId: TEST_FAMILY_ID, pedagogyPreference: pedagogy });
  return createLearner(db, {
    familyId: TEST_FAMILY_ID,
    name: 'Ivy',
    dateOfBirth: format(subYears(new Date(), ageYears), 'yyyy-MM-dd'),
  });
}

beforeEach(() => {
  sanityFetch.mockReset();
});

describe('GET /api/watch-for — real DB', () => {
  it('401s when signed out', async () => {
    asSignedOut();
    expect((await get(`learner=${crypto.randomUUID()}&dlo=dlo.M1.developing`)).status).toBe(401);
  });

  it('composes confirmed notes with the tradition line, gated in GROQ on confirmation', async () => {
    const ivy = await seed('waldorf_steiner', 9);
    sanityReturns(NOTES, WALDORF);

    const res = await get(`learner=${ivy.id}&dlo=dlo.M1.developing&dlo=dlo.L2.developing`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [
        {
          dloId: 'dlo.M1.developing',
          learnerId: ivy.id,
          kind: 'says',
          lookFor: 'Counting may land on the right number without starting over.',
          how: 'Tell it as a story first; listen for what they say back later.',
        },
      ],
    });

    expect(sanityFetch).toHaveBeenCalledWith(WATCH_FOR_NOTES_QUERY, {
      dloIds: ['dlo.M1.developing', 'dlo.L2.developing'],
    });
    expect(sanityFetch).toHaveBeenCalledWith(FRAMEWORK_WATCH_HOW_QUERY, { pedagogyKey: 'waldorf_steiner' });
    expect(WATCH_FOR_NOTES_QUERY).toContain('defined(watchForConfirmedAt)');
    expect(FRAMEWORK_WATCH_HOW_QUERY).toContain('defined(watchHowConfirmedAt)');
  });

  it('applies the Waldorf under-7 override from the child’s date of birth', async () => {
    const ivy = await seed('waldorf_steiner', 5);
    sanityReturns(NOTES, WALDORF);
    const body = await (await get(`learner=${ivy.id}&dlo=dlo.M1.developing`)).json();
    expect(body.items[0].how).toBe("Don't ask for explanation. Notice if it turns up in their play.");
  });

  it('shows the look-for alone when the tradition lines are unconfirmed (query returns none)', async () => {
    const ivy = await seed('charlotte_mason', 6);
    sanityReturns(NOTES, null);
    const body = await (await get(`learner=${ivy.id}&dlo=dlo.M1.developing`)).json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].how).toBeNull();
  });

  it('returns nothing for DLOs with no confirmed note', async () => {
    const ivy = await seed('eclectic', 6);
    sanityReturns([], null);
    expect(await (await get(`learner=${ivy.id}&dlo=dlo.M5.emerging`)).json()).toEqual({ items: [] });
  });

  it('drops suppressed (H6) and malformed DLO ids before reading Sanity', async () => {
    const ivy = await seed('eclectic', 6);
    sanityReturns([], null);
    expect(await (await get(`learner=${ivy.id}&dlo=dlo.H6.emerging&dlo=not-a-dlo`)).json()).toEqual({ items: [] });
    expect(sanityFetch).not.toHaveBeenCalled();
  });

  it('degrades to no lines when Sanity fails', async () => {
    const ivy = await seed('eclectic', 6);
    sanityFetch.mockRejectedValue(new Error('sanity down'));
    const res = await get(`learner=${ivy.id}&dlo=dlo.M1.developing`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });

  it('400s on a bad query and 404s for another family’s child', async () => {
    await seed('eclectic', 6);
    expect((await get('learner=nope&dlo=dlo.M1.developing')).status).toBe(400);
    expect((await get(`learner=${crypto.randomUUID()}`)).status).toBe(400);

    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const theirs = await createLearner(db, { familyId: other.id, name: 'Not yours' });
    sanityReturns(NOTES, WALDORF);
    expect((await get(`learner=${theirs.id}&dlo=dlo.M1.developing`)).status).toBe(404);
  });
});
