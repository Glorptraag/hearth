'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import ModuleCard from './ModuleCard';
import type { Indicators } from '@/lib/sanity/pack-indicators';

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

interface PlannerGridProps {
  weekDates: Date[];
  entries: PlannerEntry[];
  learners: Learner[];
  today: string;
  isCurrentOrFutureWeek: boolean;
  moduleIdsWithMaterials?: Set<string>;
  moduleIndicators?: Map<string, Indicators>;
  onAdd: (date: string, session: string) => void;
  onToggle: (id: string, currentStatus: string | null) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string, toDate: string, toSession: string) => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SUBJECT_DOT: Record<string, string> = {
  english:      'bg-domain-english',
  mathematics:  'bg-domain-mathematics',
  science:      'bg-domain-science',
  hass:         'bg-domain-hass',
  arts:         'bg-domain-arts',
  technologies: 'bg-domain-technologies',
  hpe:          'bg-domain-hpe',
  languages:    'bg-domain-languages',
};

// Local calendar date, not UTC. `today` is produced server-side with the same
// date-fns `format`, and toISOString() would shift a whole day behind it in any
// positive-offset zone (AEST included), keying every column to the wrong day.
function toDateString(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export default function PlannerGrid({
  weekDates,
  entries,
  learners,
  today,
  isCurrentOrFutureWeek,
  moduleIdsWithMaterials,
  moduleIndicators,
  onAdd,
  onToggle,
  onDelete,
  onMove,
}: PlannerGridProps) {
  const isReadOnly = !isCurrentOrFutureWeek;
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [, setDraggingId] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: string, session: string) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    setDragOverCell(null);
    setDraggingId(null);
    if (entryId && onMove) {
      onMove(entryId, date, session);
    }
  }, [onMove]);

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-border-subtle bg-surface-panel shadow-card">
      <div
        className="grid min-w-[620px]"
        style={{ gridTemplateColumns: `56px repeat(${weekDates.length}, minmax(100px, 1fr))` }}
      >
        {/* ── Row 1: corner + day headers ── */}
        <div className="border-b border-r border-border-subtle" />
        {weekDates.map((d) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === today;
          const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
          const daySubjects = [
            ...new Set(
              entries
                .filter((e) => e.date === dateStr)
                .flatMap((e) => e.subjects ?? [])
            ),
          ].slice(0, 6);

          return (
            <div
              key={dateStr}
              className={`border-b border-r border-border-subtle px-sm py-sm text-center ${
                isToday
                  ? 'bg-[linear-gradient(180deg,rgba(217,123,58,0.10)_0%,transparent_100%)]'
                  : ''
              }`}
            >
              <p className={`font-serif text-[0.875rem] font-semibold ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                {DAY_LABELS[dayIndex]}
              </p>
              <p className={`font-sans text-[0.6875rem] ${isToday ? 'text-ember' : 'text-text-muted'}`}>
                {d.getDate()}
              </p>
              {isToday && (
                <span className="mt-xs inline-block rounded-full bg-ember px-sm py-[1px] font-sans text-[0.5rem] font-semibold uppercase tracking-[0.06em] text-text-inverse">
                  Today
                </span>
              )}
              {daySubjects.length > 0 && (
                <div className="flex gap-[3px] justify-center mt-xs">
                  {daySubjects.map((s) => (
                    <span
                      key={s}
                      className={`h-[4px] w-[4px] rounded-full ${SUBJECT_DOT[s] ?? 'bg-border-medium'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Row 2: Morning session ── */}
        <div className="flex items-start justify-center border-b border-r border-border-subtle bg-surface-raised px-xs pt-sm pb-sm">
          <span className="font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-text-muted [writing-mode:vertical-lr] rotate-180">
            Morning
          </span>
        </div>
        {weekDates.map((d) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const morningEntries = entries.filter((e) => e.date === dateStr && (e.session ?? 'morning') === 'morning');

          const morningCellKey = `morning-${dateStr}`;
          const isMorningDragOver = dragOverCell === morningCellKey && !isPast && !isReadOnly;

          return (
            <div
              key={morningCellKey}
              onDragOver={!isReadOnly && !isPast ? (e) => handleDragOver(e, morningCellKey) : undefined}
              onDragLeave={handleDragLeave}
              onDrop={!isReadOnly && !isPast ? (e) => handleDrop(e, dateStr, 'morning') : undefined}
              className={`flex min-h-[110px] flex-col gap-xs border-b border-r border-border-subtle p-xs transition-colors duration-[var(--motion-quick)] ${
                isToday ? 'bg-ember-glow/20' : ''
              } ${isPast ? 'opacity-70' : ''} ${
                isMorningDragOver ? 'bg-ember/10 border-ember/30' : ''
              }`}
            >
              {morningEntries.map((entry) => (
                <ModuleCard
                  key={entry.id}
                  entry={entry}
                  learners={learners}
                  isReadOnly={isReadOnly}
                  hasMaterials={!!(entry.moduleId && moduleIdsWithMaterials?.has(entry.moduleId))}
                  indicators={entry.moduleId ? moduleIndicators?.get(entry.moduleId) : undefined}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onDragStart={setDraggingId}
                  onDragEnd={() => { setDraggingId(null); setDragOverCell(null); }}
                />
              ))}
              {!isReadOnly && !isPast && (
                <button
                  onClick={() => onAdd(dateStr, 'morning')}
                  className="mt-auto flex items-center justify-center rounded-md border border-dashed border-text-muted/20 py-xs font-sans text-xs text-text-muted/40 transition-all duration-[var(--motion-quick)] hover:border-ember hover:bg-ember-glow hover:text-ember"
                >
                  +
                </button>
              )}
            </div>
          );
        })}

        {/* ── Row 3: Afternoon session ── */}
        <div className="flex items-start justify-center border-r border-border-subtle bg-surface-raised px-xs pt-sm pb-sm">
          <span className="font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-text-muted [writing-mode:vertical-lr] rotate-180">
            Afternoon
          </span>
        </div>
        {weekDates.map((d) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const afternoonEntries = entries.filter((e) => e.date === dateStr && e.session === 'afternoon');

          const afternoonCellKey = `afternoon-${dateStr}`;
          const isAfternoonDragOver = dragOverCell === afternoonCellKey && !isPast && !isReadOnly;

          return (
            <div
              key={afternoonCellKey}
              onDragOver={!isReadOnly && !isPast ? (e) => handleDragOver(e, afternoonCellKey) : undefined}
              onDragLeave={handleDragLeave}
              onDrop={!isReadOnly && !isPast ? (e) => handleDrop(e, dateStr, 'afternoon') : undefined}
              className={`flex min-h-[110px] flex-col gap-xs border-r border-border-subtle p-xs transition-colors duration-[var(--motion-quick)] ${
                isToday ? 'bg-ember-glow/20' : ''
              } ${isPast ? 'opacity-70' : ''} ${
                isAfternoonDragOver ? 'bg-ember/10 border-ember/30' : ''
              }`}
            >
              {afternoonEntries.map((entry) => (
                <ModuleCard
                  key={entry.id}
                  entry={entry}
                  learners={learners}
                  isReadOnly={isReadOnly}
                  hasMaterials={!!(entry.moduleId && moduleIdsWithMaterials?.has(entry.moduleId))}
                  indicators={entry.moduleId ? moduleIndicators?.get(entry.moduleId) : undefined}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onDragStart={setDraggingId}
                  onDragEnd={() => { setDraggingId(null); setDragOverCell(null); }}
                />
              ))}
              {!isReadOnly && !isPast && (
                <button
                  onClick={() => onAdd(dateStr, 'afternoon')}
                  className="mt-auto flex items-center justify-center rounded-md border border-dashed border-text-muted/20 py-xs font-sans text-xs text-text-muted/40 transition-all duration-[var(--motion-quick)] hover:border-ember hover:bg-ember-glow hover:text-ember"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
