import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seedCapabilityThreads } from '@/scripts/seed-capability-threads';

/**
 * POST /api/seed/capability-threads
 *
 * Seeds all 57 capability threads into Sanity CMS.
 * Requires authentication.
 *
 * Response: { success: boolean; created: number; failed: number; message: string }
 */
export async function POST(_req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development or for specific admin users
    if (process.env.NODE_ENV === 'production') {
      const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
      if (!adminIds.includes(userId)) {
        return NextResponse.json(
          { error: 'Seeding not allowed in production' },
          { status: 403 }
        );
      }
    }

    console.log(`[API] Seeding capability threads initiated by ${userId}`);

    const { created, failed } = await seedCapabilityThreads();

    const success = failed === 0;
    const message = success
      ? `Successfully seeded all ${created} capability threads`
      : `Seeded ${created} threads with ${failed} failures`;

    return NextResponse.json({
      success,
      created,
      failed,
      message,
    });
  } catch (error) {
    console.error('[API] Capability thread seeding error:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed capability threads',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
