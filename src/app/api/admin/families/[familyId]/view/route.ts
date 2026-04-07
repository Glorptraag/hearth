import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  families,
  familySettings,
  learners,
  learningEntries,
  badgeAwards,
  familyIntelligenceSnapshots,
  notifications,
} from '@/lib/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { z } from 'zod';

const bodySchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  const { familyId } = await params;

  // Audit BEFORE returning data — same logical operation
  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'family.view',
    targetResource: 'family',
    targetId: familyId,
    reason: body.reason,
  });

  // Fetch family
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  }

  // Parallel fetches for detail sections
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    settings,
    childRows,
    recentEntries,
    snapshotRows,
    notificationRows,
  ] = await Promise.all([
    // Family settings
    db
      .select()
      .from(familySettings)
      .where(eq(familySettings.familyId, familyId))
      .limit(1),

    // Children with badge counts — names only, no facilitator notes
    db
      .select({
        id: learners.id,
        name: learners.name,
        dateOfBirth: learners.dateOfBirth,
        colourToken: learners.colourToken,
        displayOrder: learners.displayOrder,
        badgeCount: sql<number>`coalesce((
          select count(*)::int from badge_awards
          where badge_awards.learner_id = ${learners.id}
          and badge_awards.retracted_at is null
        ), 0)`,
      })
      .from(learners)
      .where(eq(learners.familyId, familyId))
      .orderBy(learners.displayOrder),

    // Recent entries — titles only, last 10
    db
      .select({
        id: learningEntries.id,
        title: learningEntries.title,
        dateOccurred: learningEntries.dateOccurred,
        status: learningEntries.status,
        evidenceCount: sql<number>`coalesce(array_length(${learningEntries.evidenceUrls}, 1), 0)`,
      })
      .from(learningEntries)
      .where(eq(learningEntries.familyId, familyId))
      .orderBy(desc(learningEntries.dateOccurred))
      .limit(10),

    // Snapshot state
    db
      .select({
        id: familyIntelligenceSnapshots.id,
        rebuiltAt: familyIntelligenceSnapshots.rebuiltAt,
        rebuildTrigger: familyIntelligenceSnapshots.rebuildTrigger,
        snapshotVersion: familyIntelligenceSnapshots.snapshotVersion,
        updatedAt: familyIntelligenceSnapshots.updatedAt,
      })
      .from(familyIntelligenceSnapshots)
      .where(eq(familyIntelligenceSnapshots.familyId, familyId))
      .limit(1),

    // Pending notifications last 7 days
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        tier: notifications.tier,
        title: notifications.title,
        state: notifications.state,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.familyId, familyId),
          gte(notifications.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20),
  ]);

  const snapshot = snapshotRows[0] ?? null;
  let snapshotAgeHours: number | null = null;
  if (snapshot?.rebuiltAt) {
    snapshotAgeHours = Math.round(
      (Date.now() - new Date(snapshot.rebuiltAt).getTime()) / 3600000
    );
  }

  return NextResponse.json({
    family: {
      id: family.id,
      familyName: family.familyName,
      clerkUserId: family.clerkUserId,
      onboardingComplete: family.onboardingComplete,
      createdAt: family.createdAt,
    },
    settings: settings[0]
      ? {
          pedagogyPreference: settings[0].pedagogyPreference,
          state: settings[0].state,
          registrationNumber: settings[0].registrationNumber,
          nextReportDate: settings[0].nextReportDate,
        }
      : null,
    children: childRows,
    recentEntries,
    snapshotState: snapshot
      ? {
          rebuiltAt: snapshot.rebuiltAt,
          rebuildTrigger: snapshot.rebuildTrigger,
          snapshotVersion: snapshot.snapshotVersion,
          ageHours: snapshotAgeHours,
        }
      : null,
    notifications: notificationRows,
  });
}
