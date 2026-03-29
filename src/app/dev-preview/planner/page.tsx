import PlannerClient from '@/app/(auth)/planner/PlannerClient';
import { mockPlannerEntries, mockLearners, mockSnapshot } from '../mock-data';

export default function DevPreviewPlanner() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <PlannerClient
      initialEntries={mockPlannerEntries.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        moduleId: e.moduleId,
        learnerIds: e.learnerIds,
        date: e.date,
      }))}
      learners={mockLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken,
      }))}
      recommendations={mockSnapshot.recommendations}
      today={today}
    />
  );
}
