import DashboardClient from '@/app/(auth)/dashboard/DashboardClient';
import {
  mockFamily,
  mockSnapshot,
  mockEntries,
  mockPlannerEntries,
  mockLearners,
} from '../mock-data';

export default function DevPreviewDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const todayEntryCount = mockEntries.filter((e) => e.dateOccurred === today).length;

  return (
    <DashboardClient
      familyName={mockFamily.familyName}
      snapshot={{
        activityStreak: mockSnapshot.activityStreak,
        lastLogDate: mockSnapshot.lastLogDate,
        weeklyThreadCoverage: mockSnapshot.weeklyThreadCoverage,
        activeModulesCount: mockSnapshot.activeModulesCount,
        hearthVoice: mockSnapshot.hearthVoice,
        weekStats: mockSnapshot.weekStats,
        recommendations: mockSnapshot.recommendations,
      }}
      recentEntries={mockEntries.slice(0, 5).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        dateOccurred: e.dateOccurred,
        subjects: e.subjects,
        learnerIds: e.learnerIds,
        source: e.source,
      }))}
      todayPlanner={mockPlannerEntries
        .filter((p) => p.date === today)
        .map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          moduleId: p.moduleId,
        }))}
      learners={mockLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken,
        shapeIcon: l.shapeIcon,
        dateOfBirth: l.dateOfBirth,
      }))}
      todayEntryCount={todayEntryCount}
    />
  );
}
