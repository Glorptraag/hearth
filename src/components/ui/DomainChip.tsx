// Centralised subject → colour mapping. Used by DomainChip and any screen
// that needs subject pill styling (Report, Portfolio, Capabilities, Project Detail).

export const DOMAIN_CLASSES: Record<string, string> = {
  english:      'bg-sky-900/30 text-sky-300 border-sky-700/30',
  mathematics:  'bg-orange-900/20 text-orange-300 border-orange-700/20',
  science:      'bg-emerald-900/20 text-emerald-300 border-emerald-700/20',
  hass:         'bg-amber-900/20 text-amber-300 border-amber-700/20',
  arts:         'bg-purple-900/20 text-purple-300 border-purple-700/20',
  technologies: 'bg-teal-900/20 text-teal-300 border-teal-700/20',
  hpe:          'bg-rose-900/20 text-rose-300 border-rose-700/20',
  languages:    'bg-cyan-900/20 text-cyan-300 border-cyan-700/20',
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
