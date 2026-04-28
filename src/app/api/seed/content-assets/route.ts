import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth/admin';
import { seedContentAssets } from '@/scripts/seed-content-assets';

/**
 * POST /api/seed/content-assets
 *
 * Seeds test content assets and commons texts into Sanity CMS.
 * Creates 3 assets + 2 commons texts, links them to activities,
 * and updates pack rollup counts.
 *
 * Requires authentication. Production-restricted to admin users.
 */
export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'production' && !isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Seeding not allowed in production' },
        { status: 403 }
      );
    }

    const results = await seedContentAssets();

    return NextResponse.json({
      success: results.failed === 0,
      created: results.created,
      linked: results.linked,
      failed: results.failed,
      errors: results.errors,
      message: `Created ${results.created} documents, linked ${results.linked} activities. ${results.failed} failures.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}
