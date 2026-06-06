/**
 * Evidence photos are children's photos — the most sensitive data class in the
 * app. New uploads are stored as PRIVATE Vercel blobs and served only through
 * the authenticated proxy (`GET /api/evidence`), which checks the Clerk session
 * + family ownership before streaming the bytes. The value persisted on
 * `learning_entries.evidenceUrls` (and on quick-capture items) is the blob
 * *pathname* (`evidence/<familyId>/<file>`), never a directly-fetchable URL.
 *
 * Legacy rows may still hold a full public blob URL (pre-private migration);
 * those are already public, so they render directly via the passthrough below.
 */

/** The blob pathname prefix every evidence upload is stored under. */
export const EVIDENCE_PREFIX = 'evidence';

/** A photo for display: the stored blob ref plus its optional caption. */
export interface PhotoEvidence {
  /** Blob pathname or legacy public URL — pass through {@link evidenceSrc}. */
  ref: string;
  caption: string | null;
}

/**
 * Normalise an entry's photo evidence for the portfolio, preferring the
 * caption-carrying `learning_entry_evidence` rows and falling back to the
 * legacy `evidenceUrls` text[] for entries saved before the dual-write. This is
 * the read side of the migration — once `evidenceUrls` is retired the fallback
 * branch (and the field) can be dropped.
 */
export function entryPhotoEvidence(entry: {
  evidence?: { kind: string; content: string; caption: string | null }[] | null;
  evidenceUrls?: string[] | null;
}): PhotoEvidence[] {
  const photoRows = entry.evidence?.filter((e) => e.kind === 'photo') ?? [];
  if (photoRows.length > 0) {
    return photoRows.map((e) => ({ ref: e.content, caption: e.caption }));
  }
  return (entry.evidenceUrls ?? []).map((ref) => ({ ref, caption: null }));
}

/**
 * Build the client-facing `src`/`href` for a stored evidence reference.
 * - Absolute URLs (legacy public blobs) render directly.
 * - Pathnames (private blobs) go through the authenticated proxy.
 */
export function evidenceSrc(ref: string | null | undefined): string {
  if (!ref) return '';
  if (/^https?:\/\//i.test(ref)) return ref;
  return `/api/evidence?ref=${encodeURIComponent(ref)}`;
}

/**
 * Authorise a requested evidence pathname against the caller's family.
 *
 * The owning family id is embedded in the blob pathname
 * (`evidence/<familyId>/<file>`), so the path itself is the ACL: a family may
 * only read blobs under its own prefix. No DB round-trip is needed.
 *
 * Returns the validated pathname, or `null` if it is malformed, escapes the
 * evidence prefix, attempts traversal, or belongs to another family.
 */
export function authorizeEvidenceRef(
  ref: string | null | undefined,
  familyId: string,
): string | null {
  if (!ref) return null;
  // Reject anything that isn't a plain blob pathname under our prefix.
  if (ref.includes('..') || ref.startsWith('/') || /^https?:\/\//i.test(ref)) return null;
  const segments = ref.split('/');
  // Expect at least `evidence/<familyId>/<file>`.
  if (segments.length < 3) return null;
  if (segments[0] !== EVIDENCE_PREFIX) return null;
  if (segments[1] !== familyId) return null;
  return ref;
}
