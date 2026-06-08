import { describe, it, expect, afterEach } from 'vitest';
import { encryptField, decryptField, isEncrypted } from './field-encryption';

// vitest.setup.ts sets FACILITATOR_NOTES_ENCRYPTION_KEY to a fixed test key.

describe('field-encryption (AES-256-GCM)', () => {
  afterEach(() => {
    // Restore the test key in case a missing-key test cleared it.
    process.env.FACILITATOR_NOTES_ENCRYPTION_KEY ||=
      Buffer.alloc(32, 7).toString('base64');
  });

  it('round-trips encrypt → decrypt', () => {
    const plaintext = 'Liam struggles with transitions — keep mornings unhurried.';
    const encrypted = encryptField(plaintext);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it('produces a versioned, non-plaintext ciphertext', () => {
    const plaintext = 'private observation';
    const encrypted = encryptField(plaintext);
    expect(encrypted.startsWith('fenc1:')).toBe(true);
    expect(encrypted).not.toContain(plaintext);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('uses a fresh IV per call (same input → different ciphertext)', () => {
    const a = encryptField('same input');
    const b = encryptField('same input');
    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe('same input');
    expect(decryptField(b)).toBe('same input');
  });

  it('round-trips unicode and empty strings', () => {
    for (const s of ['', 'こんにちは 🌸', 'a'.repeat(5000)]) {
      expect(decryptField(encryptField(s))).toBe(s);
    }
  });

  it('throws when ciphertext is tampered (GCM auth)', () => {
    const encrypted = encryptField('do not modify');
    // Flip one character in the base64 body (after the prefix).
    const body = encrypted.slice('fenc1:'.length);
    const flipped = body[10] === 'A' ? 'B' : 'A';
    const tampered = 'fenc1:' + body.slice(0, 10) + flipped + body.slice(11);
    expect(() => decryptField(tampered)).toThrow();
  });

  it('treats a value without the prefix as legacy plaintext', () => {
    const legacy = 'this row predates encryption';
    expect(isEncrypted(legacy)).toBe(false);
    // Returned unchanged, and without needing the key.
    expect(decryptField(legacy)).toBe(legacy);
  });

  it('decrypts legacy plaintext even when the key is absent (fail-safe read)', () => {
    const saved = process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
    delete process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
    try {
      expect(decryptField('plaintext note')).toBe('plaintext note');
    } finally {
      process.env.FACILITATOR_NOTES_ENCRYPTION_KEY = saved;
    }
  });

  it('throws a clear error on the encrypt path when the key is missing', () => {
    const saved = process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
    delete process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
    try {
      expect(() => encryptField('x')).toThrow(/FACILITATOR_NOTES_ENCRYPTION_KEY/);
    } finally {
      process.env.FACILITATOR_NOTES_ENCRYPTION_KEY = saved;
    }
  });

  it('rejects a key that does not decode to 32 bytes', () => {
    const saved = process.env.FACILITATOR_NOTES_ENCRYPTION_KEY;
    process.env.FACILITATOR_NOTES_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString('base64');
    try {
      expect(() => encryptField('x')).toThrow(/32 bytes/);
    } finally {
      process.env.FACILITATOR_NOTES_ENCRYPTION_KEY = saved;
    }
  });
});
