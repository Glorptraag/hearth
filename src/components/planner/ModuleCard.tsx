import Link from 'next/link';
import { FilePdf, Play, X } from '@/components/icons';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Indicators } from '@/lib/sanity/pack-indicators';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface ModuleCardProps {
  entry: {
    id: string;
    title: string | null;
    status: string | null;
    moduleId: string | null;
    learnerIds: string[] | null;
    subjects: string[] | null;
  };
  learners: Learner[];
  isReadOnly?: boolean;
  hasMaterials?: boolean;
  indicators?: Indicators;
  onToggle: (id: string, currentStatus: string | null) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

const COLOUR_DOT: Record<string, string> = {
  rose: 'bg-child-rose',
  blue: 'bg-child-blue',
  sage: 'bg-child-sage',
  violet: 'bg-child-violet',
  amber: 'bg-amber-status',
};

const SUBJECT_CHIP: Record<string, string> = {
  english:      'bg-domain-english/15 text-domain-english',
  mathematics:  'bg-domain-mathematics/15 text-domain-mathematics',
  science:      'bg-domain-science/15 text-domain-science',
  hass:         'bg-domain-hass/15 text-domain-hass',
  arts:         'bg-domain-arts/15 text-domain-arts',
  technologies: 'bg-domain-technologies/15 text-domain-technologies',
  hpe:          'bg-domain-hpe/15 text-domain-hpe',
  languages:    'bg-domain-languages/15 text-domain-languages',
};

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Maths',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Tech',
  hpe: 'HPE',
  languages: 'Lang',
};

export default function ModuleCard({
  entry,
  learners,
  isReadOnly = false,
  hasMaterials = false,
  indicators,
  onToggle,
  onDelete,
  onDragStart,
  onDragEnd,
}: ModuleCardProps) {
  const entryLearners = learners.filter((l) => entry.learnerIds?.includes(l.id));
  const isComplete = entry.status === 'completed';
  const primarySubject = entry.subjects?.[0] ?? null;

  return (
    <div
      draggable={!isReadOnly}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', entry.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(entry.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group relative flex flex-col gap-xs rounded-md border overflow-hidden transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
        !isReadOnly ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isComplete
          ? 'border-border-subtle bg-[linear-gradient(135deg,rgba(123,191,138,0.04),transparent)] opacity-55'
          : 'border-border-subtle bg-surface-raised hover:border-border-medium hover:shadow-hover hover:-translate-y-[1px]'
      }`}
    >
      {/* Ember top-line on hover */}
      {!isComplete && (
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[var(--motion-quick)] group-hover:opacity-100" />
      )}

      <div className="p-sm pt-[6px]">
        {/* Subject chip + material indicator */}
        <div className="flex items-center gap-[3px] mb-[3px]">
          {primarySubject && (
            <span className={`inline-block rounded-full px-[5px] py-[1px] font-sans text-[9px] font-semibold ${SUBJECT_CHIP[primarySubject] ?? 'bg-surface-hover text-text-muted'}`}>
              {SUBJECT_LABELS[primarySubject] ?? primarySubject}
            </span>
          )}
          {hasMaterials && (
            <span className="inline-flex text-text-muted" title="Has printable materials" aria-label="Has printable materials">
              <FilePdf size={14} aria-hidden="true" />
            </span>
          )}
          {/* Trailing group. Delete sits in flow beside the indicators rather
              than absolutely in the corner, so its target can be sized to the
              WCAG bar without overlapping them. */}
          {(indicators || !isReadOnly) && (
            <div className="ml-auto flex items-center gap-[3px]">
              {indicators && (
                <PackIndicators
                  context="card-compact"
                  printables={indicators.printables}
                  materials={indicators.materials}
                />
              )}
              {!isReadOnly && (
                <button
                  onClick={() => onDelete(entry.id)}
                  // 26px clears SC 2.5.8 (24px); the negative block margin keeps
                  // it from growing the chip row. Explicit size rather than
                  // hit-target's 44px so the destructive target can't swallow
                  // taps meant for the adjacent indicator dots.
                  // Opacity (not `hidden`) so it stays focusable — display:none
                  // drops it out of the tab order entirely.
                  className="-my-[6px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded text-text-muted opacity-0 transition-[opacity,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                  aria-label="Remove"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status dot (toggle) + title (opens the runner when a module backs
            this entry; free-text entries keep the title as the toggle). */}
        <div className="flex items-start gap-xs w-full">
          <button
            onClick={() => !isReadOnly && onToggle(entry.id, entry.status)}
            disabled={isReadOnly}
            aria-label={`Mark "${entry.title ?? 'Untitled'}" ${isComplete ? 'planned' : 'complete'}`}
            // p/-m enlarges the tap target past the 8px dot without moving layout.
            // Capped at 28px (not hit-target's 44) so it can't swallow taps
            // meant for the adjacent title button.
            className="mt-[3px] shrink-0 p-[10px] -m-[10px]"
          >
            <span
              className={`block h-[8px] w-[8px] rounded-full transition-colors ${
                isComplete
                  ? 'bg-sage'
                  : entry.status === 'in_progress'
                    ? 'bg-ember'
                    : 'border border-border-medium bg-transparent'
              }`}
            />
          </button>
          {entry.moduleId ? (
            <Link
              href={`/module/${encodeURIComponent(entry.moduleId)}?plannerEntryId=${encodeURIComponent(entry.id)}`}
              className={`inline-flex items-start gap-[3px] font-sans text-[0.6875rem] font-medium leading-snug hover:text-ember transition-colors duration-[var(--motion-quick)] ${
                isComplete ? 'text-text-muted line-through' : 'text-text-primary'
              }`}
            >
              <span>{entry.title ?? 'Untitled'}</span>
              <Play size={10} weight="fill" className="mt-[2px] shrink-0 opacity-60" aria-hidden="true" />
            </Link>
          ) : (
            <button
              onClick={() => !isReadOnly && onToggle(entry.id, entry.status)}
              disabled={isReadOnly}
              className={`font-sans text-[0.6875rem] font-medium leading-snug text-left ${
                isComplete ? 'text-text-muted line-through' : 'text-text-primary'
              }`}
            >
              {entry.title ?? 'Untitled'}
            </button>
          )}
        </div>

        {/* Learner dots */}
        {entryLearners.length > 0 && (
          <div className="flex gap-xs pl-[12px] mt-xs">
            {entryLearners.map((l) => (
              <span
                key={l.id}
                className={`h-[6px] w-[6px] rounded-full ${COLOUR_DOT[l.colourToken ?? ''] ?? 'bg-surface-hover'}`}
                title={l.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
