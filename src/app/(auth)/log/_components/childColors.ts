/**
 * Child identity colour classes used across the Logger form sections.
 *
 * Relocated from `log/page.tsx` so the extracted form sections (WhoSection,
 * the engagement section, …) share one map rather than each re-deriving it.
 * Keyed by `colourToken`, falling back to `rose`.
 */
export const CHILD_COLORS: Record<
  string,
  { border: string; bg: string; text: string; ring: string }
> = {
  rose: { border: 'border-child-rose', bg: 'bg-child-rose/10', text: 'text-child-rose', ring: 'focus-within:ring-child-rose/30' },
  blue: { border: 'border-child-blue', bg: 'bg-child-blue/10', text: 'text-child-blue', ring: 'focus-within:ring-child-blue/30' },
  sage: { border: 'border-child-sage', bg: 'bg-child-sage/10', text: 'text-child-sage', ring: 'focus-within:ring-child-sage/30' },
  amber: { border: 'border-amber-status', bg: 'bg-amber-status/10', text: 'text-amber-status', ring: 'focus-within:ring-amber-status/30' },
};
