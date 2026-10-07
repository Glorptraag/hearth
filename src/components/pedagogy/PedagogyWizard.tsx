'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Pedagogy } from '@/types';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useSlidingTabIndicator } from '@/hooks/use-sliding-tab-indicator';
import { ArrowLeft, CaretDown, CaretUp, Check, Flame, X } from '@/components/icons';
import {
  PHILOSOPHIES,
  VALUES,
  PRACTICES,
  DEMO_ACTIVITY,
  getCompatibilityStatus,
  getPhilosophyById,
  getValueById,
  getPracticeById,
  getPhilosophyInsight,
  getValuesInsight,
  getPracticesInsight,
  generateSynthesis,
  type CompatibilityStatus,
  type ProfileItem,
} from './data';

export interface PedagogyWizardResult {
  philosophy: Pedagogy | null;
  values: string[];
  practices: string[];
}

export interface PedagogyWizardProps {
  /** Pre-fill from existing profile. Pass empty/nulls to start fresh. */
  initial?: Partial<PedagogyWizardResult>;
  /** Fired when the wizard completes (Step 4 → "Light the Hearth"). */
  onComplete: (result: PedagogyWizardResult) => void | Promise<void>;
  /** Fired when the user taps "Skip for now". Absent = no skip option. */
  onSkip?: () => void | Promise<void>;
  /**
   * Fired when the user dismisses the wizard without saving or skipping.
   * When present, the wizard opts into modal semantics: role="dialog",
   * aria-modal, focus trap, Escape to close, and a Close button in the
   * header. Omit this prop when the wizard IS the page (onboarding).
   */
  onClose?: () => void;
  /** Saving flag — disables Continue / Light the Hearth buttons. */
  saving?: boolean;
  /**
   * Inline error to surface in the footer (e.g. when an `onSkip`/`onComplete`
   * callback's PATCH returns a non-OK HTTP status). Setting it does not stop
   * the wizard advancing — the parent decides whether to advance or not.
   */
  errorMessage?: string;
  /** Overrides the final CTA label; defaults to "Light the Hearth". */
  completeLabel?: string;
}

const STEP_LABELS = ['Philosophy', 'Values', 'Practices', 'Review'] as const;
const MAX_PRIORITIES = 5;

// localStorage key for in-flight wizard state. Persists across page
// reloads and modal closes so a parent who closes mid-flow returns to
// the same step and selections. Cleared on successful onComplete or
// onSkip; deliberately NOT cleared on onClose (that's the whole point).
const WIZARD_DRAFT_KEY = 'hearth-pedagogy-wizard-draft';

interface WizardDraft {
  step: number;
  philosophy: Pedagogy | null;
  values: string[];
  practices: string[];
}

function readDraft(): WizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    // Light shape check — bail if the JSON was tampered or schema drifted.
    if (
      typeof parsed.step !== 'number' ||
      !Array.isArray(parsed.values) ||
      !Array.isArray(parsed.practices)
    ) {
      return null;
    }
    return {
      step: parsed.step,
      philosophy: (parsed.philosophy ?? null) as Pedagogy | null,
      values: parsed.values as string[],
      practices: parsed.practices as string[],
    };
  } catch {
    return null;
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(WIZARD_DRAFT_KEY);
  } catch {
    /* silent — quota / privacy mode shouldn't block the wizard */
  }
}

export function PedagogyWizard({
  initial,
  onComplete,
  onSkip,
  onClose,
  saving = false,
  errorMessage,
  completeLabel = 'Light the Hearth',
}: PedagogyWizardProps) {
  // Lazy initializers read the draft once on mount. Draft beats `initial`
  // because it represents the user's most recent in-flight intent.
  const [step, setStep] = useState<number>(() => readDraft()?.step ?? 0);
  const [philosophy, setPhilosophy] = useState<Pedagogy | null>(
    () => readDraft()?.philosophy ?? initial?.philosophy ?? null
  );
  const [values, setValues] = useState<string[]>(
    () => readDraft()?.values ?? initial?.values ?? []
  );
  const [practices, setPractices] = useState<string[]>(
    () => readDraft()?.practices ?? initial?.practices ?? []
  );
  const [insightTab, setInsightTab] = useState<InsightTabKey>('philosophy');

  // Persist on every change. Cheap — small payload, infrequent updates.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        WIZARD_DRAFT_KEY,
        JSON.stringify({ step, philosophy, values, practices } satisfies WizardDraft)
      );
    } catch {
      /* silent — same quota / privacy reasoning as clearDraft */
    }
  }, [step, philosophy, values, practices]);

  const isModal = Boolean(onClose);
  const focusTrapRef = useFocusTrap(isModal);

  const canProceed = useMemo(() => {
    if (step === 0) return philosophy !== null;
    if (step === 1) return values.length > 0;
    if (step === 2) return practices.length > 0;
    return true;
  }, [step, philosophy, values.length, practices.length]);

  const disabledHint = useMemo(() => {
    if (step === 0 && philosophy === null) return 'Pick a philosophy to continue';
    if (step === 1 && values.length === 0) return 'Pick at least one value to continue';
    if (step === 2 && practices.length === 0) return 'Pick at least one practice to continue';
    return null;
  }, [step, philosophy, values.length, practices.length]);

  const goNext = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    // The user has committed. Clear the draft now so a refresh after a
    // successful save lands them in a clean state. If the parent's
    // onComplete fails, current in-memory state remains intact for retry.
    clearDraft();
    onComplete({ philosophy, values, practices });
  }, [step, philosophy, values, practices, onComplete]);

  const handleSkip = useCallback(() => {
    if (!onSkip) return;
    clearDraft();
    onSkip();
  }, [onSkip]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // Modal-only side effects: Escape to close, and body scroll lock so the
  // underlying Settings page can't scroll behind the overlay.
  useEffect(() => {
    if (!isModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) onClose();
    }
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModal, onClose]);

  const rootProps = isModal
    ? {
        role: 'dialog' as const,
        'aria-modal': true,
        'aria-labelledby': 'pedagogy-wizard-title',
      }
    : { 'aria-labelledby': 'pedagogy-wizard-title' };

  return (
    <div
      ref={focusTrapRef}
      {...rootProps}
      className="flex min-h-dvh flex-col bg-surface-body text-text-primary"
    >
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-panel">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-md py-sm md:px-xl">
          <p className="font-serif text-lg font-bold text-text-primary tracking-[-0.02em] md:text-2xl">
            Hearth
          </p>
          <div className="flex items-center gap-sm">
            {onSkip && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="font-sans text-xs text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] disabled:opacity-50"
              >
                Skip for now
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close wizard"
                className="rounded-[6px] border border-border-subtle px-sm py-xs font-sans text-xs text-text-secondary hover:border-border-medium hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border-subtle bg-surface-panel">
        <div className="mx-auto flex max-w-[680px] items-center justify-center gap-xs overflow-x-auto overscroll-x-contain scrollbar-none px-md py-md md:gap-md md:py-lg">
          {STEP_LABELS.map((label, idx) => {
            const isActive = idx === step;
            const isComplete = idx < step;
            return (
              <div key={label} className="flex items-center gap-xs md:gap-md">
                <div className="flex flex-col items-center gap-xs">
                  <div
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 font-sans text-xs font-semibold transition duration-[var(--motion-quick)] md:h-9 md:w-9 md:text-sm',
                      isActive
                        ? 'bg-ember text-text-inverse border-transparent shadow-[0_0_16px_rgba(217,123,58,0.5)]'
                        : isComplete
                          ? 'bg-transparent border-ember text-ember'
                          : 'bg-surface-hover border-transparent text-text-secondary',
                    ].join(' ')}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isComplete ? <Check size={14} aria-hidden="true" /> : idx + 1}
                  </div>
                  <span
                    className={[
                      'font-sans text-[10px] font-semibold uppercase tracking-[0.08em] md:text-[11px]',
                      isActive ? 'text-text-primary' : 'text-text-muted',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={[
                      'mb-[20px] h-[2px] w-8 transition-colors duration-[var(--motion-gentle)] md:w-[60px]',
                      idx < step ? 'bg-ember' : 'bg-surface-hover',
                    ].join(' ')}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-md py-lg md:px-xl md:py-2xl">
          {step === 0 && (
            <PhilosophyStep
              selected={philosophy}
              onSelect={setPhilosophy}
            />
          )}
          {step === 1 && (
            <PriorityStep
              kind="values"
              title="What Matters Most"
              description="Select up to 5 values and reorder to prioritise. Your top values guide how Hearth highlights what's important in your learning activities."
              options={VALUES}
              selected={values}
              philosophy={philosophy}
              onChange={setValues}
            />
          )}
          {step === 2 && (
            <PriorityStep
              kind="practices"
              title="Your Daily Practices"
              description="Select up to 5 practices that you use or want to use in your homeschool. These shape the specific suggestions Hearth offers."
              options={PRACTICES}
              selected={practices}
              philosophy={philosophy}
              onChange={setPractices}
            />
          )}
          {step === 3 && (
            <ReviewStep
              philosophy={philosophy}
              values={values}
              practices={practices}
              insightTab={insightTab}
              onChangeInsightTab={setInsightTab}
            />
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="border-t border-border-subtle bg-surface-panel">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-md px-md py-md md:px-xl">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm text-text-secondary hover:border-border-medium hover:text-text-primary transition duration-[var(--motion-quick)] disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Back</span>
            </button>
          ) : (
            <span className="invisible" aria-hidden="true">
              placeholder
            </span>
          )}
          <div className="flex items-center gap-md">
            {errorMessage ? (
              <span role="alert" className="font-sans text-xs text-red-400">
                {errorMessage}
              </span>
            ) : (
              disabledHint && !saving && (
                <span className="font-sans text-xs text-text-muted">
                  {disabledHint}
                </span>
              )
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed || saving}
              className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)] ease-[var(--ease-default)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ember"
            >
              {step < 3
                ? 'Continue'
                : saving
                  ? 'Saving…'
                  : completeLabel === 'Light the Hearth'
                    ? <span className="inline-flex items-center gap-xs"><Flame size={14} aria-hidden="true" /> {completeLabel}</span>
                    : completeLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Step 1: Philosophy ──────────────────────────────────────────────────

function PhilosophyStep({
  selected,
  onSelect,
}: {
  selected: Pedagogy | null;
  onSelect: (p: Pedagogy) => void;
}) {
  return (
    <>
      <header className="mb-lg md:mb-2xl">
        <h1
          id="pedagogy-wizard-title"
          className="mb-sm font-serif text-2xl font-semibold tracking-[-0.02em] text-text-primary md:text-3xl"
        >
          Your Educational Philosophy
        </h1>
        <p className="max-w-[680px] font-serif text-text-secondary leading-relaxed md:text-lg">
          This shapes how Hearth interprets your learning activities. Choose the tradition
          that resonates most with your family, or select Eclectic if you consciously draw
          from multiple sources.
        </p>
        <p className="mt-sm font-sans text-xs text-text-muted">
          Not sure? That&rsquo;s okay — Eclectic works well while you&rsquo;re exploring.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-md md:grid-cols-2 md:gap-lg lg:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
        {PHILOSOPHIES.map((p) => {
          const isSelected = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={isSelected}
              className={[
                'group relative overflow-hidden rounded-lg p-md text-left transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] md:p-xl',
                'border shadow-card',
                isSelected
                  ? 'border-border-medium bg-surface-raised shadow-float -translate-y-[2px]'
                  : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:shadow-hover hover:-translate-y-[2px]',
              ].join(' ')}
            >
              <div className="mb-sm flex items-start justify-between gap-sm">
                <h3 className="font-serif text-base font-semibold text-text-primary md:text-lg">
                  {p.name}
                </h3>
                {isSelected && (
                  <span className="flex-shrink-0 rounded-[6px] bg-ember px-sm py-[2px] font-sans text-[10px] font-semibold uppercase tracking-[0.05em] text-text-inverse">
                    Selected
                  </span>
                )}
              </div>
              <p className="mb-sm font-serif text-sm italic text-text-secondary md:text-base">
                {p.tagline}
              </p>
              <p className="mb-md font-serif text-sm text-text-secondary leading-relaxed">
                {p.description}
              </p>
              <div className="flex flex-wrap gap-xs">
                {p.keyElements.map((el) => (
                  <span
                    key={el}
                    className="rounded-[6px] border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[11px] font-medium text-text-secondary"
                  >
                    {el}
                  </span>
                ))}
              </div>
              {p.isEclectic && (
                <div className="mt-md rounded-[6px] border border-ember/30 bg-ember-glow px-sm py-xs">
                  <p className="font-sans text-[11px] leading-relaxed text-text-secondary">
                    <span aria-hidden="true">ℹ</span>{' '}
                    Eclectic requires more synthesis — some of all means less depth
                    in each tradition.
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Steps 2 & 3: Priority list (Values / Practices) ─────────────────────

function PriorityStep({
  kind,
  title,
  description,
  options,
  selected,
  philosophy,
  onChange,
}: {
  kind: 'values' | 'practices';
  title: string;
  description: string;
  options: ProfileItem[];
  selected: string[];
  philosophy: Pedagogy | null;
  onChange: (next: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < MAX_PRIORITIES) {
      onChange([...selected, id]);
    }
  };

  const move = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const remove = (id: string) => onChange(selected.filter((x) => x !== id));

  const getLabel = (id: string) =>
    kind === 'values' ? getValueById(id)?.name ?? id : getPracticeById(id)?.name ?? id;

  return (
    <>
      <header className="mb-lg md:mb-2xl">
        <h1
          id="pedagogy-wizard-title"
          className="mb-sm font-serif text-2xl font-semibold tracking-[-0.02em] text-text-primary md:text-3xl"
        >
          {title}
        </h1>
        <p className="max-w-[680px] font-serif text-text-secondary leading-relaxed md:text-lg">
          {description}
        </p>
        {philosophy && <CompatibilityLegend />}
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[320px_1fr] lg:gap-xl">
        {/* Priority panel */}
        <aside className="lg:sticky lg:top-md lg:self-start">
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="mb-md flex items-baseline justify-between">
              <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Your Priorities
              </h2>
              <span className="font-sans text-xs text-text-muted">
                {selected.length}/{MAX_PRIORITIES}
              </span>
            </div>
            {selected.length === 0 ? (
              <p className="font-serif text-sm italic text-text-muted">
                Tap items on the right to add them here. First = highest priority.
              </p>
            ) : (
              <ol className="flex flex-col gap-xs">
                {selected.map((id, idx) => (
                  <li
                    key={id}
                    className="flex items-center gap-sm rounded-[6px] border border-ember/30 bg-surface-raised px-sm py-xs"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ember font-sans text-xs font-semibold text-text-inverse"
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-serif text-sm text-text-primary">
                      {getLabel(id)}
                    </span>
                    <div className="flex gap-[2px]">
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        aria-label={`Move ${getLabel(id)} up`}
                        className="flex h-9 w-9 items-center justify-center rounded-[6px] font-sans text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                      >
                        <CaretUp size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(idx, 1)}
                        disabled={idx === selected.length - 1}
                        aria-label={`Move ${getLabel(id)} down`}
                        className="flex h-9 w-9 items-center justify-center rounded-[6px] font-sans text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                      >
                        <CaretDown size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        aria-label={`Remove ${getLabel(id)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-[6px] font-sans text-sm text-text-muted hover:bg-red-900/20 hover:text-red-400"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>

        {/* Available options */}
        <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
          {options.map((item) => {
            const isSelected = selected.includes(item.id);
            const atCap = !isSelected && selected.length >= MAX_PRIORITIES;
            const compat = getCompatibilityStatus(item, philosophy);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                disabled={atCap}
                aria-pressed={isSelected}
                className={[
                  'group flex flex-col gap-xs rounded-[10px] border p-md text-left transition duration-[var(--motion-quick)]',
                  isSelected
                    ? 'border-ember/40 bg-ember-glow'
                    : atCap
                      ? 'border-border-subtle bg-surface-panel opacity-40 cursor-not-allowed'
                      : compat === 'compatible'
                        ? 'border-ember/25 bg-ember-glow/40 hover:border-ember/40'
                        : compat === 'tension'
                          ? 'border-border-subtle bg-surface-panel hover:border-border-medium'
                          : 'border-border-subtle bg-surface-panel hover:border-border-medium',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-sm">
                  <span className="font-serif text-base font-semibold text-text-primary">
                    {item.name}
                  </span>
                  {isSelected && (
                    <span className="flex-shrink-0 text-ember" aria-hidden="true">
                      <Check size={14} />
                    </span>
                  )}
                </div>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
                {philosophy && compat !== 'neutral' && <CompatibilityBadge status={compat} philosophyId={philosophy} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function CompatibilityLegend() {
  return (
    <div className="mt-md flex flex-wrap items-center gap-md">
      <div className="flex items-center gap-xs">
        <span className="inline-block h-[8px] w-[8px] rounded-full bg-ember" aria-hidden="true" />
        <span className="font-sans text-xs text-text-muted">Aligns with your philosophy</span>
      </div>
      <div className="flex items-center gap-xs">
        <span
          className="inline-block h-[8px] w-[8px] rounded-full border border-text-muted"
          aria-hidden="true"
        />
        <span className="font-sans text-xs text-text-muted">May need reconciliation</span>
      </div>
    </div>
  );
}

function CompatibilityBadge({
  status,
  philosophyId,
}: {
  status: CompatibilityStatus;
  philosophyId: Pedagogy;
}) {
  const philosophy = getPhilosophyById(philosophyId);
  if (!philosophy) return null;
  if (status === 'compatible') {
    return (
      <span className="flex items-center gap-xs font-sans text-[11px] text-ember">
        <span className="inline-block h-[6px] w-[6px] rounded-full bg-ember" aria-hidden="true" />
        Aligns with {philosophy.name}
      </span>
    );
  }
  if (status === 'tension') {
    return (
      <span className="flex items-center gap-xs font-sans text-[11px] text-text-muted">
        <span
          className="inline-block h-[6px] w-[6px] rounded-full border border-text-muted"
          aria-hidden="true"
        />
        May need reconciliation with {philosophy.name}
      </span>
    );
  }
  return null;
}

// ─── Step 4: Review ───────────────────────────────────────────────────────

const INSIGHT_TABS = ['philosophy', 'values', 'practices'] as const;
type InsightTabKey = (typeof INSIGHT_TABS)[number];

function ReviewStep({
  philosophy,
  values,
  practices,
  insightTab,
  onChangeInsightTab,
}: {
  philosophy: Pedagogy | null;
  values: string[];
  practices: string[];
  insightTab: InsightTabKey;
  onChangeInsightTab: (tab: InsightTabKey) => void;
}) {
  // One ref per tab for roving-tabindex focus management (WAI-ARIA APG pattern).
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { listRef: tabListRef, indicatorProps: tabIndicator } = useSlidingTabIndicator(insightTab);
  const handleTabKeyDown = useCallback<React.KeyboardEventHandler<HTMLButtonElement>>(
    (e) => {
      const idx = INSIGHT_TABS.indexOf(insightTab);
      let next = idx;
      switch (e.key) {
        case 'ArrowLeft':
          next = idx === 0 ? INSIGHT_TABS.length - 1 : idx - 1;
          break;
        case 'ArrowRight':
          next = (idx + 1) % INSIGHT_TABS.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = INSIGHT_TABS.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      onChangeInsightTab(INSIGHT_TABS[next]);
      // Focus has to follow selection so the next ArrowRight on a tab
      // (not on the body) keeps cycling. requestAnimationFrame waits
      // for the active tab's tabIndex to flip from -1 to 0.
      requestAnimationFrame(() => tabRefs.current[next]?.focus());
    },
    [insightTab, onChangeInsightTab]
  );

  const philosophyObj = getPhilosophyById(philosophy);
  const synthesis = generateSynthesis(philosophy, values, practices);
  const philosophyInsight = getPhilosophyInsight(philosophy);
  const valuesInsight = getValuesInsight(values);
  const practicesInsight = getPracticesInsight(practices);
  const activeInsight =
    insightTab === 'philosophy'
      ? philosophyInsight
      : insightTab === 'values'
        ? valuesInsight
        : practicesInsight;

  return (
    <>
      <header className="mb-lg md:mb-2xl">
        <h1
          id="pedagogy-wizard-title"
          className="mb-sm font-serif text-2xl font-semibold tracking-[-0.02em] text-text-primary md:text-3xl"
        >
          Your Pedagogical Profile
        </h1>
        <p className="max-w-[680px] font-serif text-text-secondary leading-relaxed md:text-lg">
          Here is how Hearth will interpret your family&rsquo;s learning. Review the demo to
          see it in action.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2 lg:gap-xl">
        {/* Summary card */}
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card">
          <h2 className="mb-md font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Your Approach
          </h2>

          {/* Foundation */}
          <div className="mb-lg border-l-[3px] border-ember pl-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Foundation
            </p>
            {philosophyObj ? (
              <>
                <p className="mt-xs font-serif text-lg font-semibold text-text-primary">
                  {philosophyObj.name}
                </p>
                <p className="font-serif text-sm italic text-text-secondary">
                  {philosophyObj.tagline}
                </p>
              </>
            ) : (
              <p className="mt-xs font-serif text-sm italic text-text-muted">
                No philosophy selected
              </p>
            )}
          </div>

          {/* Values */}
          <SummaryPills
            label="Values · Prioritised"
            ids={values}
            getItem={getValueById}
          />

          {/* Practices */}
          <SummaryPills
            label="Practices · Prioritised"
            ids={practices}
            getItem={getPracticeById}
          />

          {/* Synthesis */}
          <div className="mt-lg rounded-[6px] border border-ember/20 bg-ember-glow p-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Synthesised Approach
            </p>
            <p className="mt-xs font-serif text-sm leading-relaxed text-text-primary">
              {synthesis}
            </p>
          </div>
        </div>

        {/* Demo activity card */}
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card">
          <h2 className="mb-md font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Sample Activity · See the Overlay
          </h2>

          <div className="mb-md">
            <p className="mb-xs font-serif text-lg font-semibold text-text-primary">
              {DEMO_ACTIVITY.title}
            </p>
            <div className="mb-sm flex flex-wrap gap-xs">
              <span className="rounded-[6px] bg-surface-raised px-xs py-[2px] font-sans text-[10px] font-medium text-text-secondary">
                {DEMO_ACTIVITY.duration}
              </span>
              {DEMO_ACTIVITY.subjects.map((s) => (
                <span
                  key={s}
                  className="rounded-[6px] bg-surface-raised px-xs py-[2px] font-sans text-[10px] font-medium text-text-secondary"
                >
                  {s}
                </span>
              ))}
            </div>
            <blockquote className="border-l-2 border-border-medium pl-md font-serif text-sm italic text-text-secondary leading-relaxed">
              {DEMO_ACTIVITY.description}
            </blockquote>
          </div>

          {/* Insight tabs */}
          <div ref={tabListRef} role="tablist" aria-label="Sample activity insights" className="relative flex gap-xs border-b border-border-subtle">
            <InsightTab
              id="insight-tab-philosophy"
              tabKey="philosophy"
              controls="insight-panel-philosophy"
              label="Philosophy Lens"
              active={insightTab === 'philosophy'}
              onClick={() => onChangeInsightTab('philosophy')}
              buttonRef={(el) => { tabRefs.current[0] = el; }}
              onKeyDown={handleTabKeyDown}
            />
            <InsightTab
              id="insight-tab-values"
              tabKey="values"
              controls="insight-panel-values"
              label="Values"
              active={insightTab === 'values'}
              onClick={() => onChangeInsightTab('values')}
              buttonRef={(el) => { tabRefs.current[1] = el; }}
              onKeyDown={handleTabKeyDown}
            />
            <InsightTab
              id="insight-tab-practices"
              tabKey="practices"
              controls="insight-panel-practices"
              label="Next Steps"
              active={insightTab === 'practices'}
              onClick={() => onChangeInsightTab('practices')}
              buttonRef={(el) => { tabRefs.current[2] = el; }}
              onKeyDown={handleTabKeyDown}
            />
            <span {...tabIndicator} />
          </div>
          <div
            key={insightTab}
            role="tabpanel"
            id={`insight-panel-${insightTab}`}
            aria-labelledby={`insight-tab-${insightTab}`}
            className="hearth-panel-enter pt-md"
          >
            <p className="mb-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember">
              {activeInsight.title}
            </p>
            <p className="font-serif text-sm leading-relaxed text-text-primary">
              {activeInsight.content}
            </p>
          </div>

          {/* Honest expectation-setting: the demo insight is fuller than a first
              real one, so we name that rather than let the sample over-promise. */}
          <p className="mt-md border-t border-border-subtle pt-sm font-sans text-[11px] leading-relaxed text-text-muted">
            This is a fuller example, to show what the overlay does. Your first
            real insights start lighter, and grow richer as you log more moments.
          </p>
        </div>
      </div>
    </>
  );
}

function SummaryPills({
  label,
  ids,
  getItem,
}: {
  label: string;
  ids: string[];
  getItem: (id: string) => ProfileItem | undefined;
}) {
  return (
    <div className="mb-lg border-t border-border-subtle pt-md">
      <p className="mb-sm font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      {ids.length === 0 ? (
        <p className="font-serif text-sm italic text-text-muted">None selected.</p>
      ) : (
        <div className="flex flex-wrap gap-xs">
          {ids.map((id, idx) => {
            const item = getItem(id);
            if (!item) return null;
            return (
              <span
                key={id}
                className="flex items-center gap-xs rounded-[6px] border border-border-subtle bg-surface-raised px-sm py-[4px]"
              >
                <span
                  aria-hidden="true"
                  className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-ember font-sans text-[10px] font-semibold text-text-inverse"
                >
                  {idx + 1}
                </span>
                <span className="font-serif text-sm text-text-primary">{item.name}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InsightTab({
  id,
  controls,
  label,
  tabKey,
  active,
  onClick,
  buttonRef,
  onKeyDown,
}: {
  id: string;
  controls: string;
  label: string;
  tabKey: string;
  active: boolean;
  onClick: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      id={id}
      data-tab-key={tabKey}
      aria-controls={controls}
      aria-selected={active}
      role="tab"
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[
        '-mb-[1px] border-b-2 border-transparent px-sm py-xs font-sans text-xs font-semibold transition-colors duration-[var(--motion-quick)]',
        active ? 'text-ember' : 'text-text-muted hover:text-text-secondary',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
