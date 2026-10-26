/**
 * Compose a watch-for line (D-HC-5, WF §3.1/§3.4; build plan HC-1c). Pure.
 *
 * A watch-for is composed, never generated (D57, D-LP-8, architecture
 * principle 4): look-for = the DLO's authored, human-confirmed
 * `watchForNext.neutral`; how = the family tradition's confirmed `watchHow`
 * line for the DLO's `evidenceKind`, with `{child}` filled in. Zero model calls.
 *
 * Render rules (pinned in compose.test.ts):
 *   - Nothing renders unless the DLO's `watchForConfirmedAt` is set — an
 *     unconfirmed note is omitted, never generated or guessed.
 *   - The how line appears only when the framework's `watchHowConfirmedAt` is
 *     set; otherwise the look-for stands alone.
 *   - Eclectic uses its neutral `watchHowFallback` lines (the borrowing rule
 *     needs signal weights that don't exist yet — WF §3.4, G55).
 *   - A tradition stage override (e.g. Waldorf `first`, under 7 · says)
 *     replaces that kind's line for a child of that age.
 *   - A missing or unknown `evidenceKind` falls back to `does`.
 */

export const EVIDENCE_KINDS = ['does', 'says', 'makes', 'chooses'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type WatchHowLines = Partial<Record<EvidenceKind, string | null>>;

/** The DLO fields the composer reads (GROQ: WATCH_FOR_NOTES_QUERY). */
export type DloWatchNote = {
  dloId: string;
  watchForNext?: { neutral?: string | null } | null;
  evidenceKind?: string | null;
  watchForConfirmedAt?: string | null;
};

/** The pedagogicalFramework fields the composer reads (GROQ: FRAMEWORK_WATCH_HOW_QUERY). */
export type FrameworkWatchHow = {
  slug: string;
  watchHow?: WatchHowLines | null;
  watchHowStageOverrides?: Array<{ stage?: string | null; kind?: string | null; text?: string | null }> | null;
  watchHowFallback?: WatchHowLines | null;
  watchHowConfirmedAt?: string | null;
};

export type WatchForChild = { name: string; age: number | null };

export type WatchForLine = {
  dloId: string;
  kind: EvidenceKind;
  /** The observable sign, verbatim from the confirmed note. */
  lookFor: string;
  /** The tradition's way to watch for it, or null when there is no confirmed line. */
  how: string | null;
};

/**
 * Tradition stage keys by age, where a tradition has them. Only Waldorf's are
 * defined in the spec today (WF §3.4; content/traditions/watch-how.yaml):
 * first 0–7 · second 7–14 · third 14+. Other traditions have no stage keys yet,
 * so no override can apply to them.
 */
export function traditionStageFor(slug: string, age: number | null): string | null {
  if (age === null || !Number.isFinite(age) || age < 0) return null;
  if (slug === 'waldorf_steiner') return age < 7 ? 'first' : age < 14 ? 'second' : 'third';
  return null;
}

export function evidenceKindOf(kind: string | null | undefined): EvidenceKind {
  return (EVIDENCE_KINDS as readonly string[]).includes(kind ?? '') ? (kind as EvidenceKind) : 'does';
}

function clean(text: string | null | undefined): string | null {
  const t = (text ?? '').trim();
  return t.length > 0 ? t : null;
}

function fillChild(text: string, childName: string): string {
  const name = childName.trim();
  return text.replace(/\{child\}/g, name || 'your child');
}

/** The tradition's how line for this kind and child, or null. */
export function composeHow(
  framework: FrameworkWatchHow | null | undefined,
  kind: EvidenceKind,
  child: WatchForChild,
): string | null {
  if (!framework || !clean(framework.watchHowConfirmedAt)) return null;
  let line: string | null;
  if (framework.slug === 'eclectic') {
    line = clean(framework.watchHowFallback?.[kind]);
  } else {
    const stage = traditionStageFor(framework.slug, child.age);
    const override = stage
      ? (framework.watchHowStageOverrides ?? []).find((o) => o?.stage === stage && o?.kind === kind)
      : undefined;
    line = clean(override?.text) ?? clean(framework.watchHow?.[kind]);
  }
  return line ? fillChild(line, child.name) : null;
}

/**
 * The watch-for for one DLO and child, or null when the DLO has no confirmed
 * note. Never invents a line.
 */
export function composeWatchFor(input: {
  dlo: DloWatchNote | null | undefined;
  framework: FrameworkWatchHow | null | undefined;
  child: WatchForChild;
}): WatchForLine | null {
  const { dlo, framework, child } = input;
  if (!dlo || !clean(dlo.watchForConfirmedAt)) return null;
  const neutral = clean(dlo.watchForNext?.neutral);
  if (!neutral) return null;
  const kind = evidenceKindOf(dlo.evidenceKind);
  return {
    dloId: dlo.dloId,
    kind,
    lookFor: fillChild(neutral, child.name),
    how: composeHow(framework, kind, child),
  };
}
