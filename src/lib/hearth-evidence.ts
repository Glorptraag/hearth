/**
 * Hearth (co-op group) session photos — children's photos shared across
 * families, so they get the same posture as family evidence (`src/lib/evidence.ts`)
 * plus a consent gate.
 *
 * Storage: PRIVATE Vercel blobs under
 *   `hearth-evidence/<hearthId>/<sessionId>/<uploaderFamilyId>/<file>`
 * `session_evidence.file_url` holds that pathname, never a fetchable URL. The
 * bytes are only served by `GET /api/hearths/[id]/evidence?ref=<pathname>`,
 * which requires active membership of the hearth named in the path.
 *
 * Consent (`hearth_memberships.consent_evidence_sharing`):
 *   - A family's uploads are shown to OTHER families only while that family is
 *     an active member with consent on. The uploader always sees its own.
 *   - A family without consent cannot upload at all (403). Uploading to a
 *     shared session is itself an act of sharing, and accepting the photo would
 *     store children's photos nobody else may see, with no UI to change consent
 *     later. Legacy uploads from non-consenting families stay hidden from others.
 *
 * Legacy rows written before this change hold a full public blob URL; they pass
 * through {@link hearthEvidenceSrc} unchanged until
 * `scripts/migrate-hearth-evidence-private.ts` moves them to private storage.
 */

export const HEARTH_EVIDENCE_PREFIX = 'hearth-evidence';

/** Upload types accepted for session photos. SVG is excluded: it can carry script. */
export const HEARTH_EVIDENCE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_RE = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export interface HearthEvidenceRef {
  pathname: string;
  hearthId: string;
  sessionId: string;
  familyId: string;
}

/** Pathname (before Vercel's random suffix) for a new session photo. */
export function hearthEvidencePath(
  ids: { hearthId: string; sessionId: string; familyId: string },
  ext: string,
): string {
  return `${HEARTH_EVIDENCE_PREFIX}/${ids.hearthId}/${ids.sessionId}/${ids.familyId}/${Date.now()}.${ext}`;
}

/**
 * Parse a requested ref into its scoping ids. Returns `null` for anything that
 * is not exactly `hearth-evidence/<uuid>/<uuid>/<uuid>/<plain file name>`:
 * absolute URLs, leading slashes, traversal, backslashes, the legacy
 * `hearth-evidence/<sessionId>/<file>` layout, or non-UUID segments.
 */
export function parseHearthEvidenceRef(ref: string | null | undefined): HearthEvidenceRef | null {
  if (!ref) return null;
  if (ref.includes('..') || ref.includes('\\') || ref.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(ref)) {
    return null;
  }
  const segments = ref.split('/');
  if (segments.length !== 5) return null;
  const [prefix, hearthId, sessionId, familyId, file] = segments;
  if (prefix !== HEARTH_EVIDENCE_PREFIX) return null;
  if (!UUID_RE.test(hearthId) || !UUID_RE.test(sessionId) || !UUID_RE.test(familyId)) return null;
  if (!FILE_RE.test(file)) return null;
  return { pathname: ref, hearthId, sessionId, familyId };
}

/**
 * Client-facing `src` for a stored `session_evidence.file_url`.
 * Pathnames go through the hearth's authenticated proxy; legacy absolute URLs
 * render directly until the migration script rewrites them.
 */
export function hearthEvidenceSrc(hearthId: string, ref: string | null | undefined): string {
  if (!ref) return '';
  if (/^https?:\/\//i.test(ref)) return ref;
  return `/api/hearths/${hearthId}/evidence?ref=${encodeURIComponent(ref)}`;
}

/** Whether a viewer may see a photo, given the hearth's consenting active families. */
export function canViewHearthEvidence(
  uploadedByFamilyId: string,
  viewerFamilyId: string,
  sharingFamilyIds: ReadonlySet<string>,
): boolean {
  return uploadedByFamilyId === viewerFamilyId || sharingFamilyIds.has(uploadedByFamilyId);
}

/**
 * Drop photos the viewer may not see and rewrite `fileUrl` to its display src.
 * Every read path that returns session evidence to a family goes through this.
 */
export function visibleHearthEvidence<T extends { uploadedByFamilyId: string; fileUrl: string }>(
  rows: T[],
  hearthId: string,
  viewerFamilyId: string,
  sharingFamilyIds: ReadonlySet<string>,
): T[] {
  return rows
    .filter((r) => canViewHearthEvidence(r.uploadedByFamilyId, viewerFamilyId, sharingFamilyIds))
    .map((r) => ({ ...r, fileUrl: hearthEvidenceSrc(hearthId, r.fileUrl) }));
}
