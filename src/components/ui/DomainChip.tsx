// Centralised subject → colour mapping. Used by DomainChip and any screen
// that needs subject pill styling (Report, Portfolio, Capabilities, Project Detail).

export const DOMAIN_CLASSES: Record<string, string> = {
  english:      'bg-domain-english/15 text-domain-english border-domain-english/20',
  mathematics:  'bg-domain-mathematics/15 text-domain-mathematics border-domain-mathematics/20',
  science:      'bg-domain-science/15 text-domain-science border-domain-science/20',
  hass:         'bg-domain-hass/15 text-domain-hass border-domain-hass/20',
  arts:         'bg-domain-arts/15 text-domain-arts border-domain-arts/20',
  technologies: 'bg-domain-technologies/15 text-domain-technologies border-domain-technologies/20',
  hpe:          'bg-domain-hpe/15 text-domain-hpe border-domain-hpe/20',
  languages:    'bg-domain-languages/15 text-domain-languages border-domain-languages/20',
};

export const DOMAIN_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Mathematics',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Technologies',
  hpe: 'HPE',
  languages: 'Languages',
};

export const DOMAIN_EMOJI: Record<string, string> = {
  english: '📚',
  mathematics: '🔢',
  science: '🔬',
  hass: '🌏',
  arts: '🎨',
  technologies: '⚙️',
  hpe: '🏃',
  languages: '🗣️',
};

interface DomainChipProps {
  subject: string;
  label?: string;
  size?: 'sm' | 'md';
  showEmoji?: boolean;
}

export default function DomainChip({ subject, label, size = 'md', showEmoji = false }: DomainChipProps) {
  const cls = DOMAIN_CLASSES[subject] ?? 'bg-surface-raised text-text-secondary border-border-subtle';
  const displayLabel = label ?? DOMAIN_LABELS[subject] ?? subject;
  const emoji = DOMAIN_EMOJI[subject];

  const sizeCls = size === 'sm'
    ? 'px-sm py-[2px] text-[0.625rem]'
    : 'px-sm py-xs text-[0.6875rem]';

  return (
    <span className={`inline-flex items-center gap-xs rounded-[6px] border font-sans font-medium tracking-wider ${sizeCls} ${cls}`}>
      {showEmoji && emoji && <span>{emoji}</span>}
      {displayLabel}
    </span>
  );
}
