'use client';

import { useState, useCallback } from 'react';
import { addDays, startOfWeek, format, isSameWeek } from 'date-fns';
import PlannerGrid from '@/components/planner/PlannerGrid';
import BottomSheet from '@/components/planner/BottomSheet';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface PlannerEntry {
  id: string;
  title: string | null;
  status: string | null;
  moduleId: string | null;
  learnerIds: string[] | null;
  date: string;
}

interface Recommendation {
  title: string;
  subject?: string;
}

interface PlannerClientProps {
  initialEntries: PlannerEntry[];
  learners: Learner[];
  recommendations: Recommendation[];
  today: string;
}

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getWeekDates(weekStart: Date, count = 5): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(weekStart, i));
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 4);
  return `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;
}

export default function PlannerClient({
  initialEntries,
  learners,
  recommendations,
  today,
}: PlannerClientProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [entries, setEntries] = useState<PlannerEntry[]>(initialEntries);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates(weekStart);
  const todayDate = new Date(today + 'T12:00:00');
  const isCurrentOrFutureWeek =
    isSameWeek(weekStart, todayDate, { weekStartsOn: 1 }) ||
    weekStart >= getWeekStart(todayDate);

  async function loadWeek(start: Date) {
    setLoading(true);
    try {
      const weekEnd = addDays(start, 6);
      const res = await fetch(
        `/api/planner?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function navWeek(delta: number) {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    loadWeek(next);
  }

  function goToCurrentWeek() {
    const current = getWeekStart(new Date());
    setWeekStart(current);
    loadWeek(current);
  }

  function handleOpenSheet(date: string) {
    setSheetDate(date);
    setSheetOpen(true);
  }

  async function handleAddEntry(payload: { date: string; title: string; learnerIds: string[] }) {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
    }
  }

  const handleToggle = useCallback(async (id: string, currentStatus: string | null) => {
    const next =
      currentStatus === 'completed'
        ? 'planned'
        : currentStatus === 'in_progress'
          ? 'completed'
          : 'in_progress';

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: next } : e))
    );

    const res = await fetch(`/api/planner/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: currentStatus } : e))
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const res = await fetch(`/api/planner/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      await loadWeek(weekStart);
    }
  }, [weekStart]);

  const isCurrentWeek = isSameWeek(weekStart, todayDate, { weekStartsOn: 1 });

  return (
    <div className="mx-auto max-w-3xl px-md py-xl">
      {/* Week navigation */}
      <div className="mb-xl flex items-center gap-md">
        <button
          onClick={() => navWeek(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border-subtle bg-surface-panel font-sans text-sm text-text-secondary transition-colors hover:border-border-medium hover:text-text-primary"
          aria-label="Previous week"
        >
          ‹
        </button>

        <button
          onClick={goToCurrentWeek}
          className="flex-1 text-center font-serif text-base font-semibold text-text-primary transition-colors hover:text-ember"
          title="Return to current week"
        >
          {formatWeekLabel(weekStart)}
        </button>

        <button
          onClick={() => navWeek(1)}
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border-subtle bg-surface-panel font-sans text-sm text-text-secondary transition-colors hover:border-border-medium hover:text-text-primary"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      {/* Week label */}
      <div className="mb-md flex items-center gap-sm">
        {isCurrentWeek && (
          <span className="rounded-full bg-ember-glow px-sm py-[2px] font-sans text-[11px] font-semibold text-ember">
            This week
          </span>
        )}
        {!isCurrentOrFutureWeek && (
          <span className="font-sans text-xs text-text-muted">Read-only — past week</span>
        )}
        {loading && (
          <span className="font-sans text-xs text-text-muted">Loading...</span>
        )}
      </div>

      {/* Empty week nudge */}
      {!loading && entries.length === 0 && isCurrentWeek && (
        <div className="mb-lg rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <span className="text-3xl mb-sm block">📝</span>
          <p className="font-serif text-sm text-text-secondary mb-xs">
            Nothing planned this week yet
          </p>
          <p className="font-sans text-xs text-text-muted">
            Tap + on any day to add an activity, or browse the{' '}
            <a href="/explore/activities" className="text-ember hover:underline">activity library</a>.
          </p>
        </div>
      )}

      {/* Grid */}
      <PlannerGrid
        weekDates={weekDates}
        entries={entries}
        learners={learners}
        today={today}
        isCurrentOrFutureWeek={isCurrentOrFutureWeek}
        onAdd={handleOpenSheet}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* Bottom sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        targetDate={sheetDate}
        learners={learners}
        recommendations={recommendations}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddEntry}
      />
    </div>
  );
}
