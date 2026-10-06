import { describe, it, expect } from 'vitest';
import { COPY_DEFAULTS, COPY_SURFACES } from './defaults';
import { describePlan, hasDrift, orphanSurfaces, planAllSurfaces, planSurface } from './seed-plan';

describe('planSurface', () => {
  it('creates a full document from defaults when nothing exists', () => {
    const plan = planSurface('welcome', undefined);
    expect(plan.created).toBe(true);
    expect(plan.doc._id).toBe('siteCopy-welcome');
    expect(plan.doc._type).toBe('siteCopy');
    expect(plan.doc.entries.map((e) => e.key)).toEqual(Object.keys(COPY_DEFAULTS.welcome.entries));
    expect(plan.added.length).toBe(plan.doc.entries.length);
    expect(plan.doc.entries.every((e) => e._key && e._type === 'siteCopyEntry' && e.value.length > 0)).toBe(true);
  });

  it('keeps edited Sanity values, adds new keys, drops removed keys (non-destructive)', () => {
    const plan = planSurface('auth', {
      surface: 'auth',
      entries: [
        { key: 'nav.getStarted', value: 'Join Hearth' },
        { key: 'removed.key', value: 'stale' },
      ],
    });
    expect(plan.created).toBe(false);
    expect(plan.kept).toEqual(['nav.getStarted']);
    expect(plan.added).toEqual(['nav.signIn']);
    expect(plan.dropped).toEqual(['removed.key']);
    expect(plan.overwritten).toEqual([]);
    const byKey = Object.fromEntries(plan.doc.entries.map((e) => [e.key, e.value]));
    expect(byKey['nav.getStarted']).toBe('Join Hearth');
    expect(byKey['nav.signIn']).toBe('Sign In');
    expect(byKey['removed.key']).toBeUndefined();
  });

  it('--reset overwrites edited values with the code default', () => {
    const plan = planSurface(
      'auth',
      { surface: 'auth', entries: [{ key: 'nav.getStarted', value: 'Join Hearth' }, { key: 'nav.signIn', value: 'Sign In' }] },
      { reset: true },
    );
    expect(plan.overwritten).toEqual(['nav.getStarted']);
    expect(plan.kept).toEqual(['nav.signIn']);
    expect(plan.doc.entries.find((e) => e.key === 'nav.getStarted')?.value).toBe('Get Started');
  });

  it('refreshes editor notes from code on every seed', () => {
    const plan = planSurface('onboarding', { surface: 'onboarding', entries: [] });
    const tailored = plan.doc.entries.find((e) => e.key === 'step2.state.hintTailored');
    expect(tailored?.note).toContain('{regulator}');
  });
});

describe('planAllSurfaces / hasDrift / orphans', () => {
  it('reports no drift when Sanity matches code exactly', () => {
    const synced = planAllSurfaces([]).map((p) => ({ surface: p.surface, entries: p.doc.entries }));
    const plans = planAllSurfaces(synced);
    expect(plans.length).toBe(COPY_SURFACES.length);
    expect(hasDrift(plans)).toBe(false);
    expect(describePlan(plans, [])).toContain('ok     siteCopy-landing');
  });

  it('reports drift when a key is missing or extra', () => {
    const synced = planAllSurfaces([]).map((p) => ({ surface: p.surface, entries: p.doc.entries }));
    synced[0].entries = synced[0].entries.slice(1);
    expect(hasDrift(planAllSurfaces(synced))).toBe(true);
  });

  it('lists orphan surfaces without touching them', () => {
    expect(orphanSurfaces([{ surface: 'landing' }, { surface: 'retired' }])).toEqual(['retired']);
    expect(describePlan(planAllSurfaces([]), ['retired'])).toContain('ORPHAN siteCopy surface "retired"');
  });
});
