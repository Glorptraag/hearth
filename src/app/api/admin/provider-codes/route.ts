import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { providerCodes } from '@/lib/db/schema';
import { eq, desc, sql, and, or, ilike, isNull, isNotNull } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { z } from 'zod';

const BASE32_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRawCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 12; i++) {
    const index = bytes[i % bytes.length]! % BASE32_ALPHABET.length;
    code += BASE32_ALPHABET[index];
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

async function generateUniqueCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRawCode();
    const existing = await db
      .select({ id: providerCodes.id })
      .from(providerCodes)
      .where(eq(providerCodes.code, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error('Failed to generate unique provider code after retries');
}

const createSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  expiresAt: z.string().datetime().optional(),
  heuLabel: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '50', 10)));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status === 'unused') conditions.push(isNull(providerCodes.redeemedAt));
  if (status === 'redeemed') conditions.push(isNotNull(providerCodes.redeemedAt));
  if (search) {
    conditions.push(
      or(
        ilike(providerCodes.code, `%${search}%`),
        ilike(providerCodes.heuLabel, `%${search}%`),
        ilike(providerCodes.notes, `%${search}%`),
      )
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(providerCodes)
      .where(where)
      .orderBy(desc(providerCodes.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(providerCodes)
      .where(where),
  ]);

  return NextResponse.json({
    codes: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const created: { id: string; code: string }[] = [];

  for (let i = 0; i < body.count; i++) {
    const code = await generateUniqueCode();
    const [row] = await db
      .insert(providerCodes)
      .values({
        code,
        expiresAt,
        heuLabel: body.heuLabel ?? null,
        notes: body.notes ?? null,
        createdByAdminId: admin.userId,
      })
      .returning({ id: providerCodes.id, code: providerCodes.code });
    if (row) created.push(row);
  }

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'provider_code.create',
    targetResource: 'provider_code',
    targetId: created.map((c) => c.id).join(','),
  });

  return NextResponse.json({ codes: created }, { status: 201 });
}
