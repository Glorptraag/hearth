import type { SaveBlock } from '@/lib/logger/notice';
import { noticeCopy } from './noticeCopy';

interface SaveBarProps {
  block: SaveBlock;
  saving: boolean;
  onSave: () => void;
}

const HINT: Record<NonNullable<SaveBlock>, string> = {
  'no-learner': noticeCopy.blockedNoLearner,
  'nothing-noticed': noticeCopy.blockedNothingNoticed,
};

/**
 * The one primary action. Sticky above the bottom nav on phones (safe-area
 * aware), static at the end of the form on desktop. When blocked, a muted
 * hint says why, wired to the button via aria-describedby.
 */
export function SaveBar({ block, saving, onSave }: SaveBarProps) {
  const hint = block ? HINT[block] : null;
  const hintId = 'notice-save-hint';
  return (
    <div className="sticky bottom-0 z-10 -mx-md border-t border-border-subtle bg-[var(--color-surface-nav-blur)] px-md pt-sm pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="flex flex-col gap-xs lg:flex-row-reverse lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={onSave}
          disabled={block !== null || saving}
          aria-describedby={hint ? hintId : undefined}
          className="hearth-press min-h-[48px] w-full rounded-md bg-ember px-md py-sm font-sans text-base font-semibold text-text-inverse shadow-ember disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none lg:w-auto lg:min-w-[160px]"
        >
          {saving ? noticeCopy.saving : noticeCopy.save}
        </button>
        {hint && (
          <p id={hintId} className="text-center font-sans text-xs text-text-muted lg:text-left">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
