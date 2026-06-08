/**
 * Field-level encryption for sensitive at-rest text (facilitator private notes).
 *
 * AES-256-GCM, random IV per value, authenticated. The stored format is a
 * single self-describing string:
 *
 *   fenc1:<base64( iv(12) || authTag(16) || ciphertext )>
 *
 * The `fenc1:` prefix is the version marker. It lets every consumer tell an
 * encrypted value apart from a legacy plaintext one (a row written before this
 * landed, or a fixture) without a schema flag — which keeps the migration
 * idempotent and lets reads tolerate not-yet-migrated rows.
 *
 * Key: `FACILITATOR_NOTES_ENCRYPTION_KEY`, a 32-byte (256-bit) key supplied as
 * base64 (canonical) or hex. Read lazily on each call — following the existing
 * `process.env.X_KEY` pattern (see `src/lib/stripe/client.ts`) — so importing
 * this module never throws in environments where the key is absent. The error
 * surfaces only when an encrypt/decrypt is actually attempted on the notes path.
 *
 * Fail-safe: `decryptField()` returns legacy plaintext untouched WITHOUT
 * touching the key, so reads of un-migrated data (and unrelated features) never
 * crash when the key is unset. Only encrypting, or decrypting an already
 * encrypted value, requires the key.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'fenc1:';
const IV_BYTES = 12; // GCM standard nonce length
const TAG_BYTES = 16; // GCM auth tag length
const KEY_BYTES = 32; // AES-256

const GENERATE_HINT = 'Generate one with: openssl rand -base64 32';

function loadKey(): Buffer {
  const raw = process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      `FACILITATOR_NOTES_ENCRYPTION_KEY is not set — facilitator notes cannot be encrypted or decrypted. ${GENERATE_HINT}`
    );
  }
  // 64 hex chars → hex; otherwise treat as base64. Buffer.from is lenient on
  // bad base64 (it silently drops invalid chars), so the length check below is
  // the real guard against a malformed key.
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `FACILITATOR_NOTES_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (256 bits); got ${key.length}. ${GENERATE_HINT}`
    );
  }
  return key;
}

/** True if `value` is already an encrypted, versioned ciphertext string. */
export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Encrypt a plaintext string. Returns a `fenc1:`-prefixed token. A fresh random
 * IV is used per call, so encrypting the same input twice yields different
 * ciphertext. Requires the key.
 */
export function encryptField(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/**
 * Decrypt a value produced by {@link encryptField}.
 *
 * - If `value` is NOT a `fenc1:` token it is treated as legacy plaintext and
 *   returned unchanged (no key required) — this is how reads tolerate rows that
 *   predate encryption or fixtures written in the clear.
 * - If it IS a token, the GCM auth tag is verified; any tampering (a flipped
 *   ciphertext/tag/IV byte) throws.
 */
export function decryptField(value: string): string {
  if (!isEncrypted(value)) return value;
  const key = loadKey();
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
