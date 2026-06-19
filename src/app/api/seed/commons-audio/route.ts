import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth/admin';
import { generateCommonsAudio } from '@/scripts/generate-commons-audio';
import { routeHandler } from '@/lib/api-helpers';

/**
 * POST /api/seed/commons-audio
 *
 * Generates read-aloud narration audio (Deepgram Aura) for published commons texts
 * that don't yet have an audio asset, uploads each to Sanity, and links it back to
 * the text. Write-time only.
 *
 * Body (all optional): { dryRun?: boolean, limit?: number, slug?: string, force?: boolean }
 *
 * Requires authentication. Production-restricted to admin users.
 */
export const POST = routeHandler(async (req: NextRequest) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'production' && !isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Audio generation not allowed in production' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const results = await generateCommonsAudio({
      dryRun: Boolean(body?.dryRun),
      force: Boolean(body?.force),
      slug: typeof body?.slug === 'string' ? body.slug : undefined,
      limit: typeof body?.limit === 'number' ? body.limit : undefined,
    });

    return NextResponse.json({
      success: results.failed === 0,
      generated: results.generated,
      skipped: results.skipped,
      failed: results.failed,
      dryRun: results.dryRun,
      items: results.items,
      errors: results.errors,
      message: `${results.dryRun ? '[dry run] ' : ''}Generated ${results.generated}, skipped ${results.skipped}, ${results.failed} failures.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audio generation failed' },
      { status: 500 }
    );
  }
}, { route: 'POST /api/seed/commons-audio' });
