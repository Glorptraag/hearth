'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LEARNER_COLOURS, type Pedagogy } from '@/types';
import { PedagogyWizard, type PedagogyWizardResult } from '@/components/pedagogy/PedagogyWizard';
import { track } from '@/lib/analytics/posthog';

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
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 2 state
  const defaultFamilyName = user?.lastName
    ? `${user.lastName} Family`
    : '';
  const [familyName, setFamilyName] = useState(defaultFamilyName);
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild(0)]);

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
    const validChildren = children.filter((c) => c.name.trim());
    if (validChildren.length === 0) {
      setError('Add at least one child with a name.');
      return;
    }
    if (!familyName.trim()) {
      setError('Enter a family name.');
      return;
    }

    setSaving(true);
    try {
      // Update family name
      await fetch('/api/family', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName: familyName.trim() }),
      });

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
      setError('Something went wrong. Please try again.');
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
        setError('Something went wrong saving your approach. Please try again.');
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
      setError('Network error. Please check your connection and try again.');
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
        setError("Couldn't save your defaults — please try again.");
        return;
      }
      setStep(4);
    } catch {
      setError('Network error. Please check your connection and try again.');
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
              className={`h-[8px] w-[8px] rounded-full transition-all duration-200 ${
                s === step ? 'bg-ember w-[24px]' : s < step ? 'bg-ember/40' : 'bg-surface-hover'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-lg text-center">
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              Welcome to Hearth
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed max-w-[360px]">
              Hearth helps you capture and celebrate your family&rsquo;s learning journey.
              No lesson plans required — just honest reflection on the learning that&rsquo;s already happening.
            </p>
            <button
              onClick={() => setStep(2)}
              className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover"
            >
              Let&rsquo;s set up your family
            </button>
          </div>
        )}

        {/* Step 2: Family setup */}
        {step === 2 && (
          <div className="flex flex-col gap-lg">
            <h1 className="font-serif text-2xl font-semibold text-text-primary text-center">
              Your Family
            </h1>

            {/* Family name */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs block">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. Douglas Family"
                className="w-full rounded-[6px] border border-border-subtle bg-surface-panel px-md py-sm font-serif text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Children */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-sm block">
                Your Learners
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
                          placeholder="Child's name"
                          className="w-full rounded-[6px] border border-border-subtle bg-surface-body px-md py-xs font-serif text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-200"
                        />
                        {/* Date of birth */}
                        <input
                          type="date"
                          value={child.dateOfBirth}
                          onChange={(e) => updateChild(idx, 'dateOfBirth', e.target.value)}
                          className="w-full rounded-[6px] border border-border-subtle bg-surface-body px-md py-xs font-sans text-sm text-text-secondary focus:border-ember focus:outline-none transition-colors duration-200"
                        />
                      </div>
                      {children.length > 1 && (
                        <button
                          onClick={() => removeChild(idx)}
                          className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors duration-200 mt-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Colour swatches */}
                    <div className="mt-sm flex items-center gap-xs">
                      <span className="font-sans text-[10px] text-text-muted mr-xs">Colour</span>
                      {LEARNER_COLOURS.map((colour) => (
                        <button
                          key={colour}
                          onClick={() => updateChild(idx, 'colourToken', colour)}
                          className={`h-[24px] w-[24px] rounded-full ${COLOUR_CONFIG[colour].bg} transition-all duration-200 ${
                            child.colourToken === colour
                              ? `ring-2 ${COLOUR_CONFIG[colour].ring} ring-offset-2 ring-offset-surface-panel`
                              : 'opacity-50 hover:opacity-75'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Shape picker */}
                    <div className="mt-sm flex items-center gap-xs">
                      <span className="font-sans text-[10px] text-text-muted mr-xs">Shape</span>
                      {SHAPE_OPTIONS.map((shape) => (
                        <button
                          key={shape}
                          onClick={() => updateChild(idx, 'shapeIcon', shape)}
                          className={`h-[28px] w-[28px] rounded-[6px] flex items-center justify-center text-sm transition-all duration-200 ${
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
                    className="rounded-[6px] border border-dashed border-border-medium py-sm font-sans text-sm text-text-secondary hover:border-ember hover:text-ember transition-colors duration-200"
                  >
                    + Add a child
                  </button>
                )}
              </div>
            </div>

            <p className="font-sans text-xs text-text-muted">
              Next, we&rsquo;ll ask a few questions about your educational approach so
              Hearth can personalise your insights. Takes about 3 minutes.
            </p>

            {error && (
              <p className="font-sans text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={handleSaveFamily}
              disabled={saving}
              className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 4: First log prompt */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-lg text-center">
            <span className="text-4xl" aria-hidden="true">🌱</span>
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              You&rsquo;re all set
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed max-w-[340px]">
              Think of something your family learned recently — even yesterday&rsquo;s bedtime story counts.
            </p>
            <div className="flex flex-col gap-sm w-full max-w-[240px]">
              <button
                onClick={() => handleComplete('/log')}
                disabled={saving}
                className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover disabled:opacity-50"
              >
                Log something now
              </button>
              <button
                onClick={() => handleComplete('/dashboard')}
                disabled={saving}
                className="rounded-[6px] border border-border-subtle px-lg py-sm font-sans text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary disabled:opacity-50"
              >
                Explore first
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
