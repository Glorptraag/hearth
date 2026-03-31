import DashboardClient from '@/app/(auth)/dashboard/DashboardClient';
import { mockFamily, mockSnapshot, mockEntries, mockPlannerEntries, mockLearners } from '../mock-data';

export default function DemoDashboard() {
  const todayPlanner = mockPlannerEntries.filter(
    (p) => p.date === new Date().toISOString().split('T')[0]
  );
  const todayEntryCount = mockEntries.filter(
    (e) => e.dateOccurred === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <DashboardClient
      familyName={mockFamily.familyName}
      snapshot={mockSnapshot}
      recentEntries={mockEntries}
      todayPlanner={todayPlanner}
      learners={mockLearners}
      todayEntryCount={todayEntryCount}
      basePath="/demo"
    />
  );
}
