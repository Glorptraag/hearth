'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import DomainChip from '@/components/ui/DomainChip';
import { mockModules, mockOverlays } from '@/app/demo/mock-data';
import { ActivityCard } from '@/components/screens/ActivityCard';
import type { Pedagogy } from '@/types';

const PEDAGOGY_OPTIONS: { value: Pedagogy; label: string }[] = [
  { value: 'eclectic', label: 'Eclectic' },
  { value: 'charlotte_mason', label: 'Charlotte Mason' },
  { value: 'classical', label: 'Classical' },
  { value: 'montessori', label: 'Montessori' },
  { value: 'waldorf_steiner', label: 'Waldorf' },
  { value: 'unschooling', label: 'Unschooling' },
];

type Mode = 'select' | 'prep' | 'facilitate' | 'complete';

export default function ModuleExperiencePage() {
  const params = useParams();
  const moduleId = params.id as string;
  const moduleData = mockModules.find((m) => m.id === moduleId);

  const [mode, setMode] = useState<Mode>('select');
  const [selectedApproachIndex, setSelectedApproachIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
  const [checkedObservations, setCheckedObservations] = useState<Set<number>>(new Set());
  const [demoPedagogy, setDemoPedagogy] = useState<Pedagogy>('eclectic');

  if (!moduleData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-md py-xl gap-lg">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
            Module not found
          </h1>
          <p className="font-serif text-text-secondary mb-2xl">
            The module you&apos;re looking for doesn&apos;t exist in this demo.
          </p>
          <Link
            href="/demo/explore/activities"
            className="inline-block bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const selectedApproach = moduleData.approaches[selectedApproachIndex];
  const currentActivity = selectedApproach?.activities[currentStep];
  const totalActivities = selectedApproach?.activities.length || 0;

  const toggleMaterial = (index: number) => {
    const newSet = new Set(checkedMaterials);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCheckedMaterials(newSet);
  };

  const toggleObservation = (index: number) => {
    const newSet = new Set(checkedObservations);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCheckedObservations(newSet);
  };

  const modalityEmoji: Record<string, string> = {
    kinesthetic: '🤲',
    visual: '👁',
    auditory: '👂',
    reading: '📖',
  };

  // Mode 1: Approach Selection
  if (mode === 'select') {
    return (
      <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/demo/explore/activities"
          className="font-sans text-sm font-medium text-ember hover:text-ember-hover transition-colors"
        >
          ← Back to Explore
        </Link>

        {/* Module title and meta */}
        <div className="gap-md flex flex-col">
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            {moduleData.title}
          </h1>
          <p className="font-serif text-text-secondary italic">
            {moduleData.targetUnderstanding}
          </p>

          {/* Subject chips */}
          <div className="flex flex-wrap gap-xs">
            {moduleData.subjects.map((subject) => (
              <DomainChip key={subject} subject={subject} showEmoji />
            ))}
          </div>
        </div>

        {/* Choose your approach */}
        <div className="mt-lg pt-lg border-t border-border-subtle">
          <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-md">
            Choose your approach
          </div>

          <div className="gap-md flex flex-col">
            {moduleData.approaches.map((approach, idx) => (
              <button
                key={approach.id}
                onClick={() => {
                  setSelectedApproachIndex(idx);
                  setCurrentStep(0);
                  setCheckedMaterials(new Set());
                  setCheckedObservations(new Set());
                  setMode('prep');
                }}
                className="bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-soft hover:translate-y-[-2px] hover:border-border-medium hover:shadow-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] text-left"
              >
                <div className="flex items-start gap-md">
                  <div className="text-2xl">
                    {modalityEmoji[approach.modality] || '🎯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-text-primary mb-xs">
                      {approach.title}
                    </h3>
                    <p className="font-serif text-sm text-text-secondary mb-sm">
                      {approach.description}
                    </p>
                    <p className="font-sans text-xs text-text-muted">
                      {approach.activities.length} {approach.activities.length === 1 ? 'activity' : 'activities'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Philosophy Activity Preview */}
        <div className="mt-xl pt-xl border-t border-border-subtle">
          <div className="flex items-center justify-between mb-md">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Activity preview with philosophy lens
            </p>
            <select
              value={demoPedagogy}
              onChange={(e) => setDemoPedagogy(e.target.value as Pedagogy)}
              className="bg-surface-raised border border-border-subtle rounded-md px-sm py-[4px] font-sans text-xs text-text-primary outline-none focus:border-ember"
            >
              {PEDAGOGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-md">
            {moduleData.approaches[0]?.activities.slice(0, 2).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                pedagogy={demoPedagogy}
                overlay={mockOverlays[demoPedagogy]?.[activity.id] ?? null}
                onStart={() => {
                  setSelectedApproachIndex(0);
                  setCurrentStep(moduleData.approaches[0].activities.indexOf(activity));
                  setMode('facilitate');
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mode 2: Prep
  if (mode === 'prep') {
    return (
      <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => setMode('select')}
          className="font-sans text-sm font-medium text-ember hover:text-ember-hover transition-colors self-start"
        >
          ← Back
        </button>

        {/* Approach title + modality */}
        <div className="gap-md flex flex-col">
          <div className="flex items-center gap-md">
            <span className="text-2xl">
              {modalityEmoji[selectedApproach.modality] || '🎯'}
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-text-primary">
                {selectedApproach.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="bg-surface-raised border border-border-subtle rounded-lg p-lg">
          <p className="font-serif text-sm text-text-secondary italic">
            {moduleData.targetUnderstanding}
          </p>
        </div>

        {/* Materials Checklist */}
        {currentActivity?.materials && currentActivity.materials.length > 0 && (
          <div className="pt-lg border-t border-border-subtle">
            <h2 className="font-serif font-semibold text-text-primary mb-md">
              Materials Checklist
            </h2>
            <div className="space-y-xs">
              {currentActivity.materials.map((material, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-md cursor-pointer hover:bg-surface-raised rounded-md p-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedMaterials.has(idx)}
                    onChange={() => toggleMaterial(idx)}
                    className="w-5 h-5 rounded border-border-subtle accent-ember cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-sans text-sm text-text-primary">
                      {material.name}
                    </span>
                    <div className="flex items-center gap-xs mt-xs">
                      <span className={`inline-block font-sans text-xs px-xs py-[2px] rounded-[6px] border ${
                        material.required
                          ? 'bg-ember/10 text-ember border-ember/20'
                          : 'bg-surface-raised text-text-muted border-border-subtle'
                      }`}>
                        {material.required ? 'Required' : 'Optional'}
                      </span>
                      {material.alternative && (
                        <span className="font-sans text-xs text-text-muted">
                          or {material.alternative}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Facilitator Guidance - Before */}
        {currentActivity?.facilitatorGuidance?.before && (
          <div className="pt-lg border-t border-border-subtle">
            <h2 className="font-serif font-semibold text-text-primary mb-md">
              Facilitator Guidance — Before
            </h2>
            <p className="font-serif text-sm text-text-secondary">
              {currentActivity.facilitatorGuidance.before}
            </p>
          </div>
        )}

        {/* Begin Session button */}
        <button
          onClick={() => setMode('facilitate')}
          className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200 mt-lg"
        >
          Begin Session
        </button>
      </div>
    );
  }

  // Mode 3: Facilitate
  if (mode === 'facilitate' && currentActivity) {
    const progressPercent = ((currentStep + 1) / totalActivities) * 100;

    return (
      <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="sticky top-[32px] z-20 bg-surface-body pt-xl pb-md -mx-md px-md">
          <div
            className="bg-surface-raised h-1 rounded-full overflow-hidden mb-md"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={totalActivities}
            aria-label={`Step ${currentStep + 1} of ${totalActivities}`}
          >
            <div
              className="bg-ember h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="font-sans text-xs text-text-muted" aria-hidden="true">
            Step {currentStep + 1} of {totalActivities}
          </p>
        </div>

        {/* Activity title and summary */}
        <div className="gap-md flex flex-col">
          <h1 className="font-serif text-xl font-semibold text-text-primary">
            {currentActivity.title}
          </h1>
          <p className="font-serif text-text-secondary">
            {currentActivity.summary}
          </p>
        </div>

        {/* Instructions */}
        <div className="pt-lg border-t border-border-subtle">
          <h2 className="font-serif font-semibold text-text-primary mb-md">
            Instructions
          </h2>
          <p className="font-serif text-sm text-text-primary whitespace-pre-wrap">
            {currentActivity.instructions}
          </p>
        </div>

        {/* Facilitator Tips - Collapsible */}
        <details className="pt-lg border-t border-border-subtle group" open>
          <summary className="font-serif font-semibold text-text-primary cursor-pointer select-none group-open:mb-md">
            Facilitator Tips
          </summary>
          <div className="space-y-md">
            {currentActivity.facilitatorGuidance?.during && (
              <div>
                <h3 className="font-serif text-sm font-semibold text-text-primary mb-xs">
                  During:
                </h3>
                <p className="font-serif text-sm italic text-text-secondary bg-surface-raised p-md rounded-lg">
                  {currentActivity.facilitatorGuidance.during}
                </p>
              </div>
            )}
            {currentActivity.facilitatorGuidance?.challenges && (
              <div>
                <h3 className="font-serif text-sm font-semibold text-text-primary mb-xs">
                  If stuck:
                </h3>
                <p className="font-serif text-sm text-text-muted">
                  {currentActivity.facilitatorGuidance.challenges}
                </p>
              </div>
            )}
          </div>
        </details>

        {/* Observation Prompts */}
        {currentActivity.observationPrompts && currentActivity.observationPrompts.length > 0 && (
          <div className="pt-lg border-t border-border-subtle">
            <h2 className="font-serif font-semibold text-text-primary mb-md">
              Observation Prompts
            </h2>
            <div className="space-y-xs">
              {currentActivity.observationPrompts.map((prompt, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-md cursor-pointer hover:bg-surface-raised rounded-md p-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedObservations.has(idx)}
                    onChange={() => toggleObservation(idx)}
                    className="w-5 h-5 rounded border-border-subtle accent-ember cursor-pointer mt-xs flex-shrink-0"
                  />
                  <span className="font-serif text-sm text-text-primary">
                    {prompt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-md mt-lg pt-lg border-t border-border-subtle">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm hover:border-border-medium transition-colors duration-200"
            >
              ← Previous
            </button>
          )}

          {currentStep < totalActivities - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setMode('complete')}
              className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200"
            >
              Complete Session
            </button>
          )}
        </div>
      </div>
    );
  }

  // Mode 4: Complete
  if (mode === 'complete') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-md py-xl gap-lg max-w-2xl mx-auto">
        {/* Celebration */}
        <div className="text-center space-y-lg">
          <div className="text-7xl" aria-hidden="true">🎉</div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            Session complete!
          </h1>
          <p className="font-serif text-text-secondary">
            {moduleData.title} — {selectedApproach.title}
          </p>
          <p className="font-sans text-sm text-text-muted">
            You covered {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
          </p>
        </div>

        {/* Next Steps */}
        <div className="grid grid-cols-1 gap-md w-full mt-xl pt-xl border-t border-border-subtle">
          <Link
            href="/demo/log"
            className="block text-center bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200"
          >
            Log this session
          </Link>
          <Link
            href="/demo/explore/activities"
            className="block text-center bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm hover:border-border-medium transition-colors duration-200"
          >
            Back to explore
          </Link>
          <Link
            href="/demo/planner"
            className="block text-center bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm hover:border-border-medium transition-colors duration-200"
          >
            Plan another session
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
