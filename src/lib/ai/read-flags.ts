/**
 * Photo Read gates and budgets (launch pivot W1.4; A1, A3, D-LP-3, D-LP-4).
 *
 * Photo Read rides inside the existing enrichEntry Haiku call — never a second
 * call. Image blocks are added only when ALL of these hold:
 *
 *   1. `PHOTO_READ_ENABLED=true` (OFF in production until Anthropic
 *      zero-data-retention is in place, A3);
 *   2. the family is in `PHOTO_READ_FAMILY_ALLOWLIST` (comma-separated family
 *      ids) — when the variable is set and non-empty;
 *   3. the family opted in at the first-photo disclosure
 *      (`families.photo_read_opt_in === true`; null = never asked = no);
 *   4. the entry has at least one photo.
 *
 * Pure, env-injectable, no I/O — the image loading lives in `read-images.ts`.
 */

/** Budgets for the Read section of the single enrichment call. */
export const PHOTO_READ_LIMITS = {
  /** One photo per save. The Read describes "the" photo (D-LP-2). */
  maxImages: 1,
  /** ≈ input tokens one image may cost. Client prep (W1.2) sends 768 px ≈ 790. */
  imageInputTokenCap: 1300,
  /** Extra output headroom for the Read section (prompt asks for ≤ 250). */
  readOutputTokenCap: 250,
  /** Byte ceiling for a fetched evidence blob before it is base64'd. */
  maxImageBytes: 1_500_000,
} as const;

/** Anthropic's published estimate: tokens ≈ (width × height) / 750. */
export const IMAGE_PIXELS_PER_TOKEN = 750;

type Env = Record<string, string | undefined>;

/** The global switch. Only the literal string "true" turns Read on. */
export function photoReadEnabled(env: Env = process.env): boolean {
  return (env.PHOTO_READ_ENABLED ?? '').trim().toLowerCase() === 'true';
}

/** The allowlist as a set, or `null` when unset/blank (no allowlist = any family). */
export function parsePhotoReadAllowlist(raw: string | undefined): Set<string> | null {
  if (raw === undefined) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

/**
 * Whether Read can run for this family at all, before consent and evidence:
 * the global flag plus the allowlist. Used by the opt-in API to tell the
 * client whether "reading your photo" would be true.
 */
export function photoReadAvailableFor(familyId: string, env: Env = process.env): boolean {
  if (!photoReadEnabled(env)) return false;
  const allowlist = parsePhotoReadAllowlist(env.PHOTO_READ_FAMILY_ALLOWLIST);
  return allowlist === null || allowlist.has(familyId);
}

export type PhotoReadSkipReason = 'flag-off' | 'not-allowlisted' | 'not-opted-in' | 'no-photo';

export type PhotoReadGate = { read: true } | { read: false; reason: PhotoReadSkipReason };

/** All four conditions, in order; the first that fails names the reason. */
export function photoReadGate(
  input: { familyId: string; optIn: boolean | null | undefined; photoCount: number },
  env: Env = process.env,
): PhotoReadGate {
  if (!photoReadEnabled(env)) return { read: false, reason: 'flag-off' };
  if (!photoReadAvailableFor(input.familyId, env)) return { read: false, reason: 'not-allowlisted' };
  if (input.optIn !== true) return { read: false, reason: 'not-opted-in' };
  if (input.photoCount < 1) return { read: false, reason: 'no-photo' };
  return { read: true };
}

/** Estimated input tokens for an image of the given pixel size. */
export function estimateImageTokens(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return Infinity;
  return Math.ceil((width * height) / IMAGE_PIXELS_PER_TOKEN);
}

/** True when the image fits the per-image input budget. */
export function imageWithinReadBudget(width: number, height: number): boolean {
  return estimateImageTokens(width, height) <= PHOTO_READ_LIMITS.imageInputTokenCap;
}
