import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import type { SnapshotData } from '@/types/snapshot';

interface LearnerGap {
  learnerId: string;
  underservedSubjects: string[];
  suggestedFocusThreads: string[];
}

export interface GapsResponse {
  // Per-learner gap data
  learners: LearnerGap[];
  // Subjects underserved for every learner in the family
  allLearnersUnderserved: string[];
  // Subjects underserved for at least one learner (but not all)
  someLearnersUnderserved: string[];
}

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const snapshot = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, family.id),
  });

  if (!snapshot?.snapshotData) {
    return NextResponse.json<GapsResponse>({
      learners: [],
      allLearnersUnderserved: [],
      someLearnersUnderserved: [],
    });
  }

  const data = snapshot.snapshotData as unknown as SnapshotData;
  const children = data.children ?? {};

  const learners: LearnerGap[] = Object.entries(children).map(([learnerId, child]) => ({
    learnerId,
    underservedSubjects: child.gap_analysis?.underserved_subjects ?? [],
    suggestedFocusThreads: child.gap_analysis?.suggested_focus_threads ?? [],
  }));

  // Cross-learner aggregates — only meaningful with ≥1 learner
  const allLearnersUnderserved: string[] = [];
  const someLearnersUnderserved: string[] = [];

  if (learners.length > 0) {
    // Count how many learners each subject appears in
    const subjectCounts = new Map<string, number>();
    for (const l of learners) {
      for (const subject of l.underservedSubjects) {
        subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
      }
    }
    for (const [subject, count] of subjectCounts.entries()) {
      if (count === learners.length) {
        allLearnersUnderserved.push(subject);
      } else {
        someLearnersUnderserved.push(subject);
      }
    }
  }

  return NextResponse.json<GapsResponse>({
    learners,
    allLearnersUnderserved,
    someLearnersUnderserved,
  });
}, { route: 'GET /api/snapshot/gaps' });
