import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const BASE32_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRawCode(): string {
  const bytes = randomBytes(10);
  let code = '';
  for (let i = 0; i < 16; i++) {
    const index = bytes[i % bytes.length]! % BASE32_ALPHABET.length;
    code += BASE32_ALPHABET[index];
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
}

export async function generateInvitationCode(maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateRawCode();
    const existing = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.code, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error('Failed to generate unique invitation code after retries');
}

export function normalizeCode(input: string): string {
  const stripped = input.toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (stripped.length !== 16) return input.toUpperCase().trim();
  return `${stripped.slice(0, 4)}-${stripped.slice(4, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}`;
}
