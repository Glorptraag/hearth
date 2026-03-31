import ModuleCard from './ModuleCard';

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

interface PlannerGridProps {
  weekDates: Date[];
  entries: PlannerEntry[];
  learners: Learner[];
  today: string;
  isCurrentOrFutureWeek: boolean;
  onAdd: (date: string) => void;
  onToggle: (id: string, currentStatus: string | null) => void;
  onDelete: (id: string) => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function PlannerGrid({
  weekDates,
  entries,
  learners,
  today,
  isCurrentOrFutureWeek,
  onAdd,
  onToggle,
  onDelete,
}: PlannerGridProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-panel shadow-[var(--shadow-soft)]">
      <div
        className="grid min-w-[560px]"
        style={{ gridTemplateColumns: `repeat(${weekDates.length}, minmax(100px, 1fr))` }}
      >
        {/* Day headers */}
        {weekDates.map((d) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === today;
          const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
          return (
            <div
              key={dateStr}
              className={`border-b border-border-subtle px-sm py-sm text-center ${
                isToday ? 'bg-[linear-gradient(180deg,rgba(217,123,58,0.08)_0%,transparent_100%)]' : ''
              }`}
            >
              <p
                className={`font-serif text-[0.95rem] font-semibold ${
                  isToday ? 'text-text-primary' : 'text-text-secondary'
                }`}
              >
                {DAY_LABELS[dayIndex]}
              </p>
              <p
                className={`font-sans text-[0.7rem] ${
                  isToday ? 'text-ember' : 'text-text-muted'
                }`}
              >
                {d.getDate()}
              </p>
              {isToday && (
                <span className="mt-xs inline-block rounded-full bg-ember px-sm py-[1px] font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.06em] text-text-inverse">
                  Today
                </span>
              )}
            </div>
          );
        })}

        {/* Entry columns */}
        {weekDates.map((d) => {
          const dateStr = toDateString(d);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const dayEntries = entries.filter((e) => e.date === dateStr);
          const isReadOnly = !isCurrentOrFutureWeek;

          return (
            <div
              key={dateStr}
              className={`flex min-h-[140px] flex-col gap-xs p-xs ${
                isToday
                  ? 'bg-ember-glow/30'
                  : ''
              } ${dateStr < today ? 'opacity-70' : ''}`}
            >
              {dayEntries.map((entry) => (
                <ModuleCard
                  key={entry.id}
                  entry={entry}
                  learners={learners}
                  isReadOnly={isReadOnly}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}

              {/* Add button */}
              {!isReadOnly && !isPast && (
                <button
                  onClick={() => onAdd(dateStr)}
                  className="mt-auto flex items-center justify-center rounded-md border border-dashed border-text-muted/30 py-sm font-sans text-sm text-text-muted transition-all duration-200 hover:border-ember hover:bg-ember-glow hover:text-ember"
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
