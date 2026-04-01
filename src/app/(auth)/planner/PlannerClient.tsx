'use client';

import { useState, useCallback } from 'react';
import { addDays, startOfWeek, format, isSameWeek } from 'date-fns';
import PlannerGrid from '@/components/planner/PlannerGrid';
import BottomSheet from '@/components/planner/BottomSheet';
import { usePedagogy } from '@/hooks/use-pedagogy';

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
  session: string | null;
  subjects: string[] | null;
}

interface Recommendation {
  title: string;
  subject?: string;
  reason?: string;
}

interface PlannerClientProps {
  initialEntries: PlannerEntry[];
  learners: Learner[];
  recommendations: Recommendation[];
  today: string;
  basePath?: string;
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
  basePath = '',
}: PlannerClientProps) {
  const { vocab } = usePedagogy();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [entries, setEntries] = useState<PlannerEntry[]>(initialEntries);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetSession, setSheetSession] = useState<string>('morning');
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

  function handleOpenSheet(date: string, session: string) {
    setSheetDate(date);
    setSheetSession(session);
    setSheetOpen(true);
  }

  async function handleAddEntry(payload: { date: string; title: string; learnerIds: string[]; session: string }) {
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

  const handleMove = useCallback(async (id: string, toDate: string, toSession: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry || (entry.date === toDate && (entry.session ?? 'morning') === toSession)) return;

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, date: toDate, session: toSession } : e))
    );

    const res = await fetch(`/api/planner/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: toDate, session: toSession }),
    });
    if (!res.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, date: entry.date, session: entry.session } : e))
      );
    }
  }, [entries]);

  const isCurrentWeek = isSameWeek(weekStart, todayDate, { weekStartsOn: 1 });

  return (
    <div className="mx-auto max-w-5xl px-md py-xl lg:px-xl">
      {/* Week navigation */}
      <div className="mb-lg flex items-center gap-md">
        <button
          onClick={() => navWeek(-1)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-panel font-sans text-base text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
          aria-label="Previous week"
        >
          ‹
        </button>

        <button
          onClick={goToCurrentWeek}
          className="flex-1 text-center transition-colors hover:text-ember"
          title="Return to current week"
        >
          <span className="font-serif text-[1.1rem] font-semibold text-text-primary">
            Week of {format(weekStart, 'd MMM')}
          </span>
        </button>

        <button
          onClick={() => navWeek(1)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-panel font-sans text-base text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      {/* Week label */}
      <div className="mb-lg flex items-center gap-sm">
        <span className="font-sans text-[0.75rem] text-text-muted">
          {formatWeekLabel(weekStart)}
        </span>
        {isCurrentWeek && (
          <span className="rounded-full bg-ember-glow px-sm py-[2px] font-sans text-[11px] font-semibold text-ember">
            This week
          </span>
        )}
        {!isCurrentOrFutureWeek && (
          <span className="font-sans text-xs text-text-muted">Read-only — past week</span>
        )}
        {loading && (
          <span className="font-sans text-xs text-text-muted animate-pulse">Loading...</span>
        )}
      </div>

      {/* Empty week nudge */}
      {!loading && entries.length === 0 && isCurrentWeek && (
        <div className="mb-lg rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <span className="text-3xl mb-sm block">📝</span>
          <p className="font-serif text-sm text-text-secondary mb-xs">
            {vocab.plannerFrame}
          </p>
          <p className="font-sans text-xs text-text-muted">
            Tap + in any session to add an activity, or browse the{' '}
            <a href={`${basePath}/explore/activities`} className="text-ember hover:underline">activity library</a>.
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
        onMove={handleMove}
      />

      {/* Bottom sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        targetDate={sheetDate}
        targetSession={sheetSession}
        learners={learners}
        recommendations={recommendations}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddEntry}
      />
    </div>
  );
}
