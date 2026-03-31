// Centralised learner colour map. Import LEARNER_COLOUR_MAP wherever you need
// per-learner dot/ring/pill colours, to avoid duplication across screens.

export const LEARNER_COLOUR_MAP: Record<string, { dot: string; ring: string; pill: string }> = {
  rose:   { dot: 'bg-child-rose',   ring: 'ring-child-rose/40',   pill: 'bg-child-rose/15 text-child-rose border-child-rose/20' },
  blue:   { dot: 'bg-child-blue',   ring: 'ring-child-blue/40',   pill: 'bg-child-blue/15 text-child-blue border-child-blue/20' },
  sage:   { dot: 'bg-child-sage',   ring: 'ring-child-sage/40',   pill: 'bg-child-sage/15 text-child-sage border-child-sage/20' },
  violet: { dot: 'bg-child-violet', ring: 'ring-child-violet/40', pill: 'bg-child-violet/15 text-child-violet border-child-violet/20' },
  amber:  { dot: 'bg-amber-400',    ring: 'ring-amber-400/40',    pill: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
};

const DEFAULT_COLOUR = LEARNER_COLOUR_MAP.rose;

const SIZE_MAP = {
  sm: { circle: 'h-7 w-7',   text: 'text-xs' },
  md: { circle: 'h-10 w-10', text: 'text-sm' },
  lg: { circle: 'h-16 w-16', text: 'text-3xl' },
};

interface LearnerAvatarProps {
  name: string;
  colourToken: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function LearnerAvatar({ name, colourToken, size = 'md', showName = false }: LearnerAvatarProps) {
  const colour = LEARNER_COLOUR_MAP[colourToken ?? ''] ?? DEFAULT_COLOUR;
  const { circle, text } = SIZE_MAP[size];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={showName ? 'flex items-center gap-sm' : undefined}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${circle} ${colour.dot} ring-2 ${colour.ring}`}
      >
        <span className={`font-serif font-semibold text-white/90 ${text}`}>{initial}</span>
      </div>
      {showName && (
        <span className="font-sans text-sm font-medium text-text-primary">{name}</span>
      )}
    </div>
  );
}
