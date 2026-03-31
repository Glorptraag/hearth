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
  session: string | null;
  subjects: string[] | null;
}

interface PlannerGridProps {
  weekDates: Date[];
  entries: PlannerEntry[];
  learners: Learner[];
  today: string;
  isCurrentOrFutureWeek: boolean;
  onAdd: (date: string, session: string) => void;
  onToggle: (id: string, currentStatus: string | null) => void;
  onDelete: (id: string) => void;
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
  const isReadOnly = !isCurrentOrFutureWeek;

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-panel shadow-[var(--shadow-soft)]">
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

          return (
            <div
              key={`morning-${dateStr}`}
              className={`flex min-h-[110px] flex-col gap-xs border-b border-r border-border-subtle p-xs ${
                isToday ? 'bg-ember-glow/20' : ''
              } ${isPast ? 'opacity-70' : ''}`}
            >
              {morningEntries.map((entry) => (
                <ModuleCard
                  key={entry.id}
                  entry={entry}
                  learners={learners}
                  isReadOnly={isReadOnly}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
              {!isReadOnly && !isPast && (
                <button
                  onClick={() => onAdd(dateStr, 'morning')}
                  className="mt-auto flex items-center justify-center rounded-md border border-dashed border-text-muted/20 py-xs font-sans text-xs text-text-muted/40 transition-all duration-200 hover:border-ember hover:bg-ember-glow hover:text-ember"
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

          return (
            <div
              key={`afternoon-${dateStr}`}
              className={`flex min-h-[110px] flex-col gap-xs border-r border-border-subtle p-xs ${
                isToday ? 'bg-ember-glow/20' : ''
              } ${isPast ? 'opacity-70' : ''}`}
            >
              {afternoonEntries.map((entry) => (
                <ModuleCard
                  key={entry.id}
                  entry={entry}
                  learners={learners}
                  isReadOnly={isReadOnly}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
              {!isReadOnly && !isPast && (
                <button
                  onClick={() => onAdd(dateStr, 'afternoon')}
                  className="mt-auto flex items-center justify-center rounded-md border border-dashed border-text-muted/20 py-xs font-sans text-xs text-text-muted/40 transition-all duration-200 hover:border-ember hover:bg-ember-glow hover:text-ember"
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
