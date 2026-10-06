'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LEARNER_COLOURS, type Pedagogy } from '@/types';
import { PedagogyWizard, type PedagogyWizardResult } from '@/components/pedagogy/PedagogyWizard';
import { track } from '@/lib/analytics/posthog';
import { Plant } from '@/components/icons';
import { JURISDICTIONS, getJurisdiction } from '@/config/jurisdictions';
import { formatCopy, useCopy } from '@/lib/copy';

const SHAPE_OPTIONS = ['🌟', '🦋', '🌿', '🔥', '🌊', '🎨'];

const COLOUR_CONFIG: Record<string, { label: string; bg: string; ring: string }> = {
  rose: { label: 'Rose', bg: 'bg-child-rose', ring: 'ring-child-rose' },
  blue: { label: 'Blue', bg: 'bg-child-blue', ring: 'ring-child-blue' },
  sage: { label: 'Sage', bg: 'bg-child-sage', ring: 'ring-child-sage' },
  amber: { label: 'Amber', bg: 'bg-child-amber', ring: 'ring-child-amber' },
};

type ChildDraft = {
  name: string;
  dateOfBirth: string;
  colourToken: string;
  shapeIcon: string;
};

function emptyChild(index: number): ChildDraft {
  return {
    name: '',
    dateOfBirth: '',
    colourToken: LEARNER_COLOURS[index % LEARNER_COLOURS.length],
    shapeIcon: SHAPE_OPTIONS[index % SHAPE_OPTIONS.length],
  };
}

export default function OnboardingPage() {
  // Wording is Sanity-swappable (Studio → Site Copy → "Onboarding").
  const copy = useCopy('onboarding');
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 2 state. Family name is optional — Clerk's lastName seeds the default
  // (already persisted by /api/welcome/complete), and this field only overrides
  // it. We sync the input once Clerk hydrates, but only while it's untouched
  // so a user's edit (including clearing it) is never clobbered.
  const [familyName, setFamilyName] = useState('');
  const [familyNameTouched, setFamilyNameTouched] = useState(false);
  // Australian state/territory — drives reporting copy + compliance dates.
  const [state, setState] = useState('');
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild(0)]);

  useEffect(() => {
    if (familyNameTouched) return;
    if (user?.lastName) setFamilyName(`${user.lastName} Family`);
  }, [user?.lastName, familyNameTouched]);

  // Stage-1 funnel entry: the start that pairs with `pedagogy_set` (completion).
  // Buffered in posthog.ts until the provider initialises, so it survives the
  // public-page mount-before-init ordering rather than dropping silently.
  const onboardingStartedRef = useRef(false);
  useEffect(() => {
    if (onboardingStartedRef.current) return;
    onboardingStartedRef.current = true;
    track('onboarding_started');
  }, []);

  function addChild() {
    if (children.length >= 6) return;
    setChildren([...children, emptyChild(children.length)]);
  }

  function removeChild(index: number) {
    if (children.length <= 1) return;
    setChildren(children.filter((_, i) => i !== index));
  }

  function updateChild(index: number, field: keyof ChildDraft, value: string) {
    setChildren(children.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async function handleSaveFamily() {
    setError('');

    // Validate
    if (!state) {
      setError('Select your state or territory.');
      return;
    }
    const validChildren = children.filter((c) => c.name.trim());
    if (validChildren.length === 0) {
      setError('Add at least one child with a name.');
      return;
    }

    setSaving(true);
    try {
      // Persist the state/territory so reporting copy + compliance dates match.
      const stateRes = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (!stateRes.ok) {
        setError('Could not save your state. Please try again.');
        return;
      }

      // Family name is optional — only PATCH when the user supplied a value
      // to override the Clerk-derived default already on the family row.
      const trimmedFamilyName = familyName.trim();
      if (trimmedFamilyName) {
        const familyRes = await fetch('/api/family', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyName: trimmedFamilyName }),
        });
        if (!familyRes.ok) {
          setError("We couldn't save your family name. Your details are still here — try again?");
          return;
        }
      }

      // Create learners
      for (let i = 0; i < validChildren.length; i++) {
        const child = validChildren[i];
        await fetch('/api/learners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: child.name.trim(),
            dateOfBirth: child.dateOfBirth || undefined,
            colourToken: child.colourToken,
            shapeIcon: child.shapeIcon,
            displayOrder: i,
          }),
        });
      }

      setStep(3);
    } catch {
      setError("We couldn't save your family just then. Your details are still here — try again?");
    } finally {
      setSaving(false);
    }
  }

  async function handleWizardSave(result: PedagogyWizardResult) {
    setError('');
    setSaving(true);
    try {
      const philosophy: Pedagogy = result.philosophy ?? 'eclectic';
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedagogyPreference: philosophy,
          pedagogyValues: result.values,
          pedagogyPractices: result.practices,
        }),
      });
      if (!res.ok) {
        // fetch resolves on 4xx/5xx — only the throw path hit catch.
        setError("We couldn't save your approach. Your answers are still here — try again?");
        return;
      }
      track('pedagogy_set', {
        philosophy,
        value_count: result.values.length,
        practice_count: result.practices.length,
        source: 'onboarding',
      });
      setStep(4);
    } catch {
      setError("The connection dropped before we could save. Check you're online and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkipWizard() {
    // Write the eclectic defaults so the family_settings row exists with
    // an explicit preference. Previously the inline pedagogy buttons did
    // this on every save; skipping here would leave the row uncreated
    // until the first /api/settings GET happens to trigger lazy insert.
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedagogyPreference: 'eclectic' satisfies Pedagogy,
          pedagogyValues: [],
          pedagogyPractices: [],
        }),
      });
      if (!res.ok) {
        // fetch resolves on 4xx/5xx so a thrown-only error path missed
        // these. Surface it to the user instead of silently advancing.
        setError("We couldn't save your defaults just then. Give it another go?");
        return;
      }
      setStep(4);
    } catch {
      setError("The connection dropped before we could save. Check you're online and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(destination: '/log' | '/dashboard') {
    setSaving(true);
    await fetch('/api/onboarding/complete', { method: 'POST' });
    router.push(destination);
  }

  // Step 3 renders the pedagogy wizard full-screen outside the narrow
  // onboarding shell, so bail out before the shell wraps other steps.
  if (step === 3) {
    return (
      <PedagogyWizard
        onComplete={handleWizardSave}
        onSkip={handleSkipWizard}
        saving={saving}
        errorMessage={error || undefined}
      />
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-body px-md py-xl">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-xl flex items-center justify-center gap-sm">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-[8px] w-[8px] rounded-full transition-all duration-[var(--motion-quick)] ${
                s === step ? 'bg-ember w-[24px]' : s < step ? 'bg-ember/40' : 'bg-surface-hover'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-lg text-center">
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              {copy['step1.title']}
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed max-w-[360px]">
              {copy['step1.body']}
            </p>
            <button
              onClick={() => setStep(2)}
              className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover"
            >
              {copy['step1.cta']}
            </button>
            <p className="max-w-[360px] font-sans text-[11px] text-text-muted">
              {copy['step1.consent.lead']}{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
              >
                {copy['step1.consent.terms']}
              </a>{' '}
              {copy['step1.consent.and']}{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
              >
                {copy['step1.consent.privacy']}
              </a>
              .
            </p>
          </div>
        )}

        {/* Step 2: Family setup */}
        {step === 2 && (
          <div className="flex flex-col gap-lg">
            <h1 className="font-serif text-2xl font-semibold text-text-primary text-center">
              {copy['step2.title']}
            </h1>

            {/* State / Territory — drives reporting copy + compliance dates */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs block">
                {copy['step2.state.label']}
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-[6px] border border-border-subtle bg-surface-panel px-md py-sm font-serif text-text-primary focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)] [color-scheme:dark]"
              >
                <option value="" disabled>
                  {copy['step2.state.placeholder']}
                </option>
                {Object.values(JURISDICTIONS).map((j) => (
                  <option key={j.id} value={j.id} className="bg-surface-panel">
                    {j.label} ({j.abbreviation})
                  </option>
                ))}
              </select>
              <p className="mt-xs font-sans text-xs text-text-muted">
                {state
                  ? formatCopy(copy['step2.state.hintTailored'], {
                      regulator: getJurisdiction(state).regulatoryBody,
                      regulatorShort: getJurisdiction(state).regulatoryBodyShort,
                    })
                  : copy['step2.state.hintDefault']}
              </p>
            </div>

            {/* Family name — optional override; defaults to Clerk surname */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs block">
                {copy['step2.familyName.label']} <span className="text-text-muted font-normal normal-case tracking-normal">{copy['step2.familyName.optional']}</span>
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => {
                  setFamilyNameTouched(true);
                  setFamilyName(e.target.value);
                }}
                placeholder={copy['step2.familyName.placeholder']}
                className="w-full rounded-[6px] border border-border-subtle bg-surface-panel px-md py-sm font-serif text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
              />
            </div>

            {/* Children */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm block">
                {copy['step2.learners.label']}
              </label>
              <div className="flex flex-col gap-md">
                {children.map((child, idx) => (
                  <div
                    key={idx}
                    className="rounded-[10px] border border-border-subtle bg-surface-panel p-md"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <div className="flex-1 flex flex-col gap-sm">
                        {/* Name */}
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(idx, 'name', e.target.value)}
                          placeholder={copy['step2.learner.namePlaceholder']}
                          className="w-full rounded-[6px] border border-border-subtle bg-surface-body px-md py-xs font-serif text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
                        />
                        {/* Date of birth */}
                        <input
                          type="date"
                          value={child.dateOfBirth}
                          onChange={(e) => updateChild(idx, 'dateOfBirth', e.target.value)}
                          className="w-full rounded-[6px] border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-secondary focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
                        />
                      </div>
                      {children.length > 1 && (
                        <button
                          onClick={() => removeChild(idx)}
                          className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors duration-[var(--motion-quick)] mt-xs"
                        >
                          {copy['step2.learner.remove']}
                        </button>
                      )}
                    </div>

                    {/* Colour swatches */}
                    <div className="mt-sm flex items-center gap-xs">
                      <span className="font-sans text-[10px] text-text-muted mr-xs">{copy['step2.learner.colour']}</span>
                      {LEARNER_COLOURS.map((colour) => (
                        <button
                          key={colour}
                          onClick={() => updateChild(idx, 'colourToken', colour)}
                          aria-label={`Colour ${colour}`}
                          className={`h-[32px] w-[32px] rounded-full ${COLOUR_CONFIG[colour].bg} transition-all duration-[var(--motion-quick)] ${
                            child.colourToken === colour
                              ? `ring-2 ${COLOUR_CONFIG[colour].ring} ring-offset-2 ring-offset-surface-panel`
                              : 'opacity-50 hover:opacity-75'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Shape picker */}
                    <div className="mt-sm flex items-center gap-xs">
                      <span className="font-sans text-[10px] text-text-muted mr-xs">{copy['step2.learner.shape']}</span>
                      {SHAPE_OPTIONS.map((shape) => (
                        <button
                          key={shape}
                          onClick={() => updateChild(idx, 'shapeIcon', shape)}
                          className={`h-[32px] w-[32px] rounded-[6px] flex items-center justify-center text-sm transition-all duration-[var(--motion-quick)] ${
                            child.shapeIcon === shape
                              ? 'bg-surface-hover ring-1 ring-border-medium'
                              : 'opacity-50 hover:opacity-75'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {children.length < 6 && (
                  <button
                    onClick={addChild}
                    className="rounded-[6px] border border-dashed border-border-medium py-sm font-sans text-sm text-text-secondary hover:border-ember hover:text-ember transition-colors duration-[var(--motion-quick)]"
                  >
                    {copy['step2.addChild']}
                  </button>
                )}
              </div>
            </div>

            <p className="font-sans text-xs text-text-muted">
              {copy['step2.nextHint']}
            </p>

            {error && (
              <p className="font-sans text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={handleSaveFamily}
              disabled={saving}
              className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover disabled:opacity-50"
            >
              {saving ? copy['step2.saving'] : copy['step2.continue']}
            </button>
          </div>
        )}

        {/* Step 4: First log prompt */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-lg text-center">
            <span className="inline-flex text-ember" aria-hidden="true">
              <Plant size={32} />
            </span>
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              {copy['step4.title']}
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed max-w-[340px]">
              {copy['step4.body']}
            </p>
            <div className="flex flex-col gap-sm w-full max-w-[240px]">
              <button
                onClick={() => handleComplete('/log')}
                disabled={saving}
                className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover disabled:opacity-50"
              >
                {copy['step4.logNow']}
              </button>
              <button
                onClick={() => handleComplete('/dashboard')}
                disabled={saving}
                className="rounded-[6px] border border-border-subtle px-lg py-sm font-sans text-sm font-semibold text-text-secondary transition-all duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary disabled:opacity-50"
              >
                {copy['step4.exploreFirst']}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
