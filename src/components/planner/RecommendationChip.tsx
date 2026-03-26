interface RecommendationChipProps {
  title: string;
  subject?: string;
  onAdd: (title: string) => void;
}

const SUBJECT_DOT: Record<string, string> = {
  english: 'bg-domain-english',
  mathematics: 'bg-domain-mathematics',
  science: 'bg-domain-science',
  hass: 'bg-domain-hass',
  arts: 'bg-domain-arts',
  technologies: 'bg-domain-technologies',
  hpe: 'bg-domain-hpe',
  languages: 'bg-domain-languages',
};

export default function RecommendationChip({ title, subject, onAdd }: RecommendationChipProps) {
  return (
    <div className="flex items-center justify-between gap-sm rounded-[6px] border border-border-subtle bg-surface-raised px-sm py-xs">
      <div className="flex items-center gap-xs">
        {subject && (
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${SUBJECT_DOT[subject] ?? 'bg-text-muted'}`}
          />
        )}
        <span className="font-sans text-xs text-text-primary">{title}</span>
      </div>
      <button
        onClick={() => onAdd(title)}
        className="flex-shrink-0 rounded-[6px] bg-ember px-sm py-[2px] font-sans text-[11px] font-semibold text-text-inverse transition-colors duration-200 hover:bg-ember-hover"
      >
        Add
      </button>
    </div>
  );
}
