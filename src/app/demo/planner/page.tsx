import PlannerClient from '@/app/(auth)/planner/PlannerClient';
import { mockPlannerEntries, mockLearners, mockSnapshot } from '../mock-data';

export default function DemoPlanner() {
  return (
    <PlannerClient
      initialEntries={mockPlannerEntries}
      learners={mockLearners}
      recommendations={mockSnapshot.recommendations ?? []}
      today={new Date().toISOString().split('T')[0]}
      basePath="/demo"
    />
  );
}
