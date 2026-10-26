/**
 * The constellation's headings and helper copy (W5.2, P10 / D-LP-10).
 *
 * The Constellation says what is GROWING, in trajectory language drawn from
 * signals the snapshot already carries: recent activity (last evidence within
 * RECENT_DAYS), "New" (first evidence within NEWLY_LIT_DAYS), the rebuild's
 * trajectory read, and threads opening up. The Report says what is EVIDENCED
 * (tiers under PRODUCTION_TIER_BAR, confirmed DLO links, annotated samples).
 * This file only words the first claim and points to the second; it changes no
 * evidence rule.
 *
 * Outcomes-spine copy rules: never "missing", "behind" or "gap". "Not yet
 * observed" stays as the honest unlit state. Every sentence is authored here.
 */

export const REPORT_HREF = '/our-story/report';

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const constellationCopy = {
  overline: 'OUR STORY · WHAT’S GROWING',
  title: (name: string) => `${name}’s constellation`,
  subtitle: (name: string) =>
    `What’s growing for ${name}: threads lit by the moments you log, the ones coming on lately, and where things are heading next.`,
  reportPointerLead: 'What’s evidenced for your report lives in the',
  reportPointerLink: 'Report',

  growingOverline: 'What’s growing',

  overviewHeading: 'Reading the sky',
  overviewGrowth: 'This sky shows what’s growing, not a record to check.',
  overviewReportLead: 'Moments with a photo and an objective you’ve confirmed print in the',
  overviewReportLink: 'Report',

  exploreActivityHelper: (name: string) =>
    `How much ${name} has been logged in each area — a rhythm signal, not a score.`,
  exploreReportLead: 'What’s evidenced against the curriculum is in the',
  exploreReportLink: 'Report',
  exploreIntro: (name: string) =>
    `Where ${name} has room to grow — and a few threads worth a look next. Nothing here needs fixing; it’s just where the light hasn’t fallen yet.`,
} as const;

export type GrowingSignals = {
  /** Threads lit (state 'active'). */
  lit: number;
  /** Lit threads with evidence in the last RECENT_DAYS. */
  recent: number;
  /** Lit threads whose first evidence is within NEWLY_LIT_DAYS. */
  newlyLit: number;
  /** Lit threads the rebuild reads as accelerating (shown once a thread has 3+ observations). */
  pickingUp: number;
  /** Ghost threads: their foundations are lit. */
  opening: number;
};

/**
 * The "What's growing" card, in trajectory language. One sentence per signal
 * that is present; a signal at zero says nothing rather than a deficit.
 */
export function growingSentences(name: string, s: GrowingSignals): string[] {
  const out: string[] = [];
  if (s.lit === 0) {
    out.push(`${name}’s sky fills in as you log. Each moment lights the threads it touches.`);
  } else if (s.recent > 0 && s.lit === 1) {
    out.push(`${name} has 1 thread lit, and it was active this week.`);
  } else if (s.recent > 0) {
    const which = s.recent >= s.lit ? 'all' : String(s.recent);
    out.push(`${name} has ${count(s.lit, 'thread', 'threads')} lit, ${which} of them active this week.`);
  } else {
    out.push(`${name} has ${count(s.lit, 'thread', 'threads')} lit. The next moment you log picks ${s.lit === 1 ? 'it' : 'them'} up again.`);
  }
  if (s.newlyLit > 0) {
    out.push(s.newlyLit === 1 ? 'One came on in the last fortnight.' : `${s.newlyLit} came on in the last fortnight.`);
  }
  if (s.pickingUp > 0) {
    out.push(s.pickingUp === 1 ? 'One is picking up pace.' : `${s.pickingUp} are picking up pace.`);
  }
  if (s.opening > 0) {
    out.push(
      s.opening === 1
        ? 'One thread is opening up — the threads it builds on are lit, and it tends to come on of its own accord when the foundations settle.'
        : `${s.opening} threads are opening up — the threads they build on are lit, and they tend to come on of their own accord when the foundations settle.`,
    );
  }
  return out;
}
