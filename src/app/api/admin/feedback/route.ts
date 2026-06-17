import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

const CATEGORIES = ['bug', 'idea', 'confusion', 'praise'] as const;

/**
 * GET /api/admin/feedback
 *
 * Admin-only read of the pilot feedback channel. Capture lives at
 * POST /api/feedback; this is the triage surface that makes the channel
 * usable end-to-end — rows are read here and transcribed into
 * docs/hearth-research-log.md (research log R7). Without a read path the
 * channel captures but never "produces research-log entries".
 *
 * Paginated (limit/offset, max 100) and optionally filtered by category.
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get('limit') ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 100) : 50;
  const offsetRaw = Number(searchParams.get('offset') ?? 0);
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;
  const category = searchParams.get('category') ?? '';

  const where = (CATEGORIES as readonly string[]).includes(category)
    ? eq(feedback.category, category)
    : undefined;

  const entries = await db
    .select()
    .from(feedback)
    .where(where)
    .orderBy(desc(feedback.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ entries });
}, { route: 'GET /api/admin/feedback' });
