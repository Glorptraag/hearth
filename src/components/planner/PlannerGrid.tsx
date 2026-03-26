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
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[560px] gap-xs"
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
              className={`rounded-t-[6px] px-sm py-xs text-center ${
                isToday ? 'bg-ember-glow' : ''
              }`}
            >
              <p
                className={`font-sans text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  isToday ? 'text-ember' : 'text-text-muted'
                }`}
              >
                {DAY_LABELS[dayIndex]}
              </p>
              <p
                className={`font-sans text-xs ${
                  isToday ? 'text-ember' : 'text-text-secondary'
                }`}
              >
                {d.getDate()}
              </p>
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
              className={`flex min-h-[120px] flex-col gap-xs rounded-[6px] border p-xs ${
                isToday
                  ? 'border-ember/20 bg-ember-glow/50'
                  : 'border-border-subtle bg-surface-panel'
              }`}
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
                  className="mt-auto flex items-center justify-center rounded-[6px] py-xs font-sans text-[11px] text-text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-text-secondary"
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
