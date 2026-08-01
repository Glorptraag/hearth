'use client';

import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useSheetDrag } from '@/hooks/use-sheet-drag';
import { Sun, SunHorizon, Check } from '@/components/icons';

/**
 * Touch-capable counterpart to the planner's HTML5 drag.
 *
 * HTML5 drag events never fire on touch, so on a phone a planner entry could
 * not be moved at all. Rather than reimplement drag with pointer events — the
 * week grid is a 620px-wide horizontal scroller, so a phone drag would have to
 * auto-scroll a container that is mostly off-screen — moving is expressed as an
 * explicit picker. That also makes moving reachable by keyboard and screen
 * reader, which a pointer drag never is.
 */

export interface MoveTargetDay {
  /** yyyy-MM-dd — keyed identically to the grid's own cell keys. */
  date: string;
  /** 'Mon' … 'Fri' */
  label: string;
  dayNumber: number;
  isPast: boolean;
}

export interface MoveSheetEntry {
  id: string;
  title: string | null;
  date: string;
  session: string;
}

interface MoveSheetProps {
  isOpen: boolean;
  entry: MoveSheetEntry | null;
  days: MoveTargetDay[];
  onMove: (id: string, date: string, session: string) => void;
  onClose: () => void;
}

const SESSIONS = [
  { key: 'morning', label: 'Morning', Icon: Sun },
  { key: 'afternoon', label: 'Afternoon', Icon: SunHorizon },
] as const;

export default function MoveSheet({ isOpen, entry, days, onMove, onClose }: MoveSheetProps) {
  const trapRef = useFocusTrap(isOpen);
  const dragHandleProps = useSheetDrag(trapRef, onClose);

  function handlePick(date: string, session: string) {
    if (!entry) return;
    onClose();
    if (entry.date === date && entry.session === session) return;
    onMove(entry.id, date, session);
  }

  return (
    <>
      {/* Backdrop — above the mobile bottom nav (z-100) so the sheet is truly modal */}
      <div
        className={`fixed inset-0 z-[190] backdrop-modal transition-opacity duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-sheet-title"
        className={`fixed bottom-0 left-0 right-0 z-[200] flex max-h-[85dvh] flex-col rounded-t-[16px] border-t border-border-subtle bg-surface-panel shadow-float transition-transform duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
          isOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        {/* Handle — swipe down to dismiss */}
        <div className="flex justify-center pt-sm pb-xs" {...dragHandleProps}>
          <div className="h-1 w-10 rounded-full bg-border-medium" />
        </div>

        <div className="flex items-start justify-between gap-md px-md pb-sm">
          <div className="min-w-0">
            <p id="move-sheet-title" className="font-serif text-base font-semibold text-text-primary">
              Move to...
            </p>
            <p className="truncate font-sans text-xs text-text-muted">
              {entry?.title ?? 'Untitled'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 font-sans text-sm text-text-muted transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-md pb-md">
          <ul className="flex flex-col gap-xs">
            {days.map((day) => (
              <li key={day.date} className="flex items-center gap-sm">
                <span
                  className={`w-[52px] shrink-0 font-sans text-xs font-semibold ${
                    day.isPast ? 'text-text-muted/50' : 'text-text-secondary'
                  }`}
                >
                  {day.label} {day.dayNumber}
                </span>
                {SESSIONS.map(({ key, label, Icon }) => {
                  const isCurrent = entry?.date === day.date && entry?.session === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePick(day.date, key)}
                      disabled={day.isPast}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={`${label}, ${day.label} ${day.dayNumber}${isCurrent ? ' — current' : ''}`}
                      className={`hearth-press flex min-h-[40px] flex-1 items-center justify-center gap-xs rounded-md border px-sm font-sans text-xs font-semibold transition-[background-color,border-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] disabled:cursor-not-allowed disabled:opacity-40 ${
                        isCurrent
                          ? 'border-border-active bg-ember-glow text-ember'
                          : 'border-border-subtle bg-surface-raised text-text-secondary enabled:hover:border-border-medium enabled:hover:text-text-primary'
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                      {isCurrent && <Check size={12} aria-hidden="true" />}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>

        {/* Safe area spacer */}
        <div className="h-[env(safe-area-inset-bottom,16px)]" />
      </div>
    </>
  );
}
