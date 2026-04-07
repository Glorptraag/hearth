import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  learners,
  familySettings,
  learningEntries,
  badgeAwards,
  plannerEntries,
  familyLibrary,
  facilitatorNotes,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, inArray } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const familyId = family.id;

  const familyLearners = await db
    .select()
    .from(learners)
    .where(eq(learners.familyId, familyId));
  const learnerIds = familyLearners.map((l) => l.id);

  const [settings, entries, planner, library, notes, awards] =
    await Promise.all([
      db.query.familySettings.findFirst({
        where: eq(familySettings.familyId, familyId),
      }),
      db.select().from(learningEntries).where(eq(learningEntries.familyId, familyId)),
      db.select().from(plannerEntries).where(eq(plannerEntries.familyId, familyId)),
      db.select().from(familyLibrary).where(eq(familyLibrary.familyId, familyId)),
      db.select().from(facilitatorNotes).where(eq(facilitatorNotes.familyId, familyId)),
      learnerIds.length > 0
        ? db.select().from(badgeAwards).where(inArray(badgeAwards.learnerId, learnerIds))
        : Promise.resolve([]),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    family: {
      name: family.familyName,
      createdAt: family.createdAt,
    },
    settings: settings
      ? {
          pedagogy: settings.pedagogyPreference,
          state: settings.state,
          registrationNumber: settings.registrationNumber,
          nextReportDate: settings.nextReportDate,
        }
      : null,
    learners: familyLearners.map((l) => ({
      id: l.id,
      name: l.name,
      dateOfBirth: l.dateOfBirth,
      profileData: l.profileData,
    })),
    learningEntries: entries.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      dateOccurred: e.dateOccurred,
      subjects: e.subjects,
      learnerIds: e.learnerIds,
      aiEnrichment: e.aiEnrichment,
      status: e.status,
      createdAt: e.createdAt,
    })),
    plannerEntries: planner.map((p) => ({
      id: p.id,
      date: p.date,
      title: p.title,
      moduleId: p.moduleId,
      status: p.status,
    })),
    badgeAwards: awards.map((a) => ({
      learnerId: a.learnerId,
      badgeDefinitionId: a.badgeDefinitionId,
      awardedAt: a.awardedAt,
      notes: a.notes,
    })),
    facilitatorNotes: notes.map((n) => ({
      learnerId: n.learnerId,
      noteText: n.noteText,
      createdAt: n.createdAt,
    })),
    library: library.map((l) => ({
      sanityPackId: l.sanityPackId,
      addedAt: l.addedAt,
    })),
  };

  const filename = `hearth-export-${family.familyName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
