/**
 * Logger post-save badge-threshold check.
 *
 * After an entry saves, `handleSave` asks the server whether any of the just-
 * logged learners crossed a badge threshold, then (if so) raises a "quick
 * check" toast that deep-links into the assessment flow — queueing the rest.
 *
 * The network fan-out and the deep-link/queue URL construction are the parts
 * worth pinning under test; extracted verbatim from `app/(auth)/log/page.tsx`.
 * The badge check is non-critical: a failed request for one learner contributes
 * no ready badges rather than rejecting the whole batch.
 */

/** A badge that has become assessable for a specific learner. */
export interface BadgeReady {
  badgeId: string;
  learnerId: string;
}

/** Toast descriptor for the badge-ready prompt (matches the Logger toast shape). */
export interface BadgeReadyToast {
  type: 'badge';
  message: string;
  action: { label: string; href: string };
}

/**
 * Ask `/api/badges/check-thresholds` for each learner and flatten the results
 * into a single ready-list. A non-OK response (or a thrown fetch) for any
 * learner yields no badges for that learner — the check never rejects.
 */
export async function checkBadgeThresholds(
  learnerIds: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<BadgeReady[]> {
  const perLearner = await Promise.all(
    learnerIds.map(async (learnerId) => {
      try {
        const r = await fetchImpl('/api/badges/check-thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learnerId }),
        });
        if (!r.ok) return [];
        const d = (await r.json()) as { badgeIds?: string[] };
        return (d.badgeIds ?? []).map((badgeId) => ({ badgeId, learnerId }));
      } catch {
        return [];
      }
    }),
  );
  return perLearner.flat();
}

/**
 * Build the badge-ready toast from a ready-list, or null when nothing is ready.
 *
 * The first ready badge becomes the toast's deep link; any remainder rides
 * along as a `queue` param so the assessment flow can walk them in order, with
 * `qn`/`qt` driving the "1 of N" position indicator.
 */
export function buildBadgeReadyToast(
  ready: BadgeReady[],
  learnerNameById: Map<string, string>,
): BadgeReadyToast | null {
  if (ready.length === 0) return null;

  const [first, ...rest] = ready;
  const firstName = learnerNameById.get(first.learnerId) ?? '';
  const queueParam =
    rest.length > 0
      ? `&queue=${rest.map((r) => `${r.badgeId}:${r.learnerId}`).join(',')}`
      : '';
  const positionParam = ready.length > 1 ? `&qn=1&qt=${ready.length}` : '';
  const href = `/badges/assess/${first.badgeId}?learner=${first.learnerId}&name=${encodeURIComponent(firstName)}${queueParam}${positionParam}`;

  return {
    type: 'badge',
    message:
      ready.length > 1
        ? `Hearth noticed something new — ${ready.length} quick checks ready.`
        : 'Hearth noticed something new. Quick check?',
    action: {
      label: ready.length > 1 ? `Start (${ready.length})` : 'Now (2 min)',
      href,
    },
  };
}
