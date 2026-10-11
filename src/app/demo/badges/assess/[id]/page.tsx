'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { mockBadges, mockLearners } from '@/app/demo/mock-data';

type Step = 'intro' | 'questions' | 'decision' | 'celebration';
type ResponseType = 'yes' | 'sometimes' | 'not_yet';

interface Response {
  questionId: string;
  type: ResponseType;
}

export default function BadgeAssessmentPage() {
  const params = useParams();
  const badgeId = params.id as string;
  const badge = mockBadges.find((b) => b.id === badgeId);

  const [step, setStep] = useState<Step>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedLearner] = useState(mockLearners[0]);

  if (!badge) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-md py-xl gap-lg">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
            Badge not found
          </h1>
          <p className="font-serif text-text-secondary mb-2xl">
            The badge you&apos;re looking for doesn&apos;t exist in this demo.
          </p>
          <Link
            href="/demo/dashboard"
            className="inline-block bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleResponse = (type: ResponseType) => {
    const newResponses = [...responses];
    const existingIndex = newResponses.findIndex(
      (r) => r.questionId === badge.assessmentQuestions[currentQuestion]?.id
    );

    if (existingIndex >= 0) {
      newResponses[existingIndex] = {
        questionId: badge.assessmentQuestions[currentQuestion].id,
        type,
      };
    } else {
      newResponses.push({
        questionId: badge.assessmentQuestions[currentQuestion].id,
        type,
      });
    }

    setResponses(newResponses);

    if (currentQuestion < badge.assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep('decision');
    }
  };

  const yesCount = responses.filter((r) => r.type === 'yes').length;
  const passesThreshold = yesCount >= badge.threshold;

  // Step 1: Intro
  if (step === 'intro') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-md py-xl gap-lg max-w-2xl mx-auto">
        <div className="text-center space-y-lg">
          {/* Badge emoji */}
          <div className="text-6xl">{badge.emoji}</div>

          {/* Title and description */}
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
              {badge.title}
            </h1>
            <p className="font-serif text-text-secondary">
              {badge.description}
            </p>
          </div>

          {/* Learner readiness statement */}
          <p className="font-serif italic text-text-secondary">
            It looks like {selectedLearner.name} might be ready for this badge.
          </p>

          {/* Thread info */}
          <p className="font-sans text-xs text-text-muted">
            Linked to {badge.threadName} capability thread
          </p>
        </div>

        {/* Begin button */}
        <button
          onClick={() => setStep('questions')}
          className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)] mt-xl"
        >
          Begin Assessment
        </button>
      </div>
    );
  }

  // Step 2: Questions
  if (step === 'questions') {
    const currentQ = badge.assessmentQuestions[currentQuestion];
    if (!currentQ) return null;

    const progressPercent = ((currentQuestion + 1) / badge.assessmentQuestions.length) * 100;

    return (
      <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="sticky top-[32px] z-20 bg-surface-body pt-xl pb-md -mx-md px-md">
          <div
            className="bg-surface-raised h-1 rounded-full overflow-hidden mb-md"
            role="progressbar"
            aria-valuenow={currentQuestion + 1}
            aria-valuemin={1}
            aria-valuemax={badge.assessmentQuestions.length}
            aria-label={`Question ${currentQuestion + 1} of ${badge.assessmentQuestions.length}`}
          >
            <div
              className="bg-ember h-full transition-[width] duration-[var(--motion-base)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="font-sans text-xs text-text-muted" aria-hidden="true">
            Question {currentQuestion + 1} of {badge.assessmentQuestions.length}
          </p>
        </div>

        {/* Question */}
        <div className="space-y-lg">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            {currentQ.text}
          </h2>

          {/* Observable indicator */}
          <p className="font-serif text-sm text-text-muted italic">
            {currentQ.observableIndicator}
          </p>
        </div>

        {/* Response buttons */}
        <div className="flex flex-col gap-md mt-lg pt-lg border-t border-border-subtle">
          <button
            onClick={() => handleResponse('yes')}
            className="block w-full bg-surface-panel rounded-lg p-lg border border-border-subtle shadow-card hover:translate-y-[-2px] hover:border-sage/30 hover:bg-sage/10 hover:shadow-hover transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] text-left"
          >
            <p className="font-sans font-semibold text-sage mb-xs">
              Yes — consistently
            </p>
            <p className="font-serif text-sm text-text-secondary">
              This is evident in their regular behavior and practice
            </p>
          </button>

          <button
            onClick={() => handleResponse('sometimes')}
            className="block w-full bg-surface-panel rounded-lg p-lg border border-border-subtle shadow-card hover:translate-y-[-2px] hover:border-amber-status/30 hover:bg-amber-status/20 hover:shadow-hover transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] text-left"
          >
            <p className="font-sans font-semibold text-amber-status mb-xs">
              Sometimes
            </p>
            <p className="font-serif text-sm text-text-secondary">
              This appears occasionally, but not yet consistently
            </p>
          </button>

          <button
            onClick={() => handleResponse('not_yet')}
            className="block w-full bg-surface-panel rounded-lg p-lg border border-border-subtle shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] text-left"
          >
            <p className="font-sans font-semibold text-text-secondary mb-xs">
              Not yet
            </p>
            <p className="font-serif text-sm text-text-secondary">
              This hasn&apos;t been observed yet, or appears very rarely
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Decision
  if (step === 'decision') {
    const sometimesCount = responses.filter((r) => r.type === 'sometimes').length;
    const notYetCount = responses.filter((r) => r.type === 'not_yet').length;

    return (
      <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto items-center justify-center">
        {passesThreshold ? (
          <div className="text-center space-y-lg">
            <div className="text-6xl">{badge.emoji}</div>
            <h1 className="font-serif text-xl font-semibold text-sage">
              🎉 {selectedLearner.name} is ready!
            </h1>
            <p className="font-serif text-text-secondary">
              They consistently demonstrate the capabilities needed for this badge.
            </p>

            {/* Summary */}
            <div className="bg-surface-raised rounded-lg p-lg space-y-xs text-left">
              <p className="font-sans text-sm">
                <span className="font-semibold text-sage">{yesCount}</span>
                <span className="text-text-muted"> consistently</span>
              </p>
              <p className="font-sans text-sm">
                <span className="font-semibold text-amber-status">{sometimesCount}</span>
                <span className="text-text-muted"> sometimes</span>
              </p>
              <p className="font-sans text-sm">
                <span className="font-semibold text-text-muted">{notYetCount}</span>
                <span className="text-text-muted"> not yet</span>
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-md mt-xl pt-xl border-t border-border-subtle">
              <button
                onClick={() => setStep('celebration')}
                className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)]"
              >
                Award Badge
              </button>
              <button
                onClick={() => {
                  setStep('intro');
                  setCurrentQuestion(0);
                  setResponses([]);
                }}
                className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm hover:border-border-medium transition-colors duration-[var(--motion-quick)]"
              >
                Not quite yet
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-lg">
            <div className="text-6xl">⏳</div>
            <h1 className="font-serif text-xl font-semibold text-amber-status">
              Almost there
            </h1>
            <p className="font-serif text-text-secondary">
              Keep observing — {selectedLearner.name} is on the path to this badge.
            </p>

            {/* Summary */}
            <div className="bg-surface-raised rounded-lg p-lg space-y-xs text-left">
              <p className="font-sans text-sm">
                <span className="font-semibold text-sage">{yesCount}</span>
                <span className="text-text-muted"> consistently (needs {badge.threshold})</span>
              </p>
              <p className="font-sans text-sm">
                <span className="font-semibold text-amber-status">{sometimesCount}</span>
                <span className="text-text-muted"> sometimes</span>
              </p>
              <p className="font-sans text-sm">
                <span className="font-semibold text-text-muted">{notYetCount}</span>
                <span className="text-text-muted"> not yet</span>
              </p>
            </div>

            {/* Action */}
            <Link
              href="/demo/dashboard"
              className="block w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)] text-center mt-xl pt-xl border-t border-border-subtle"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Step 4: Celebration
  if (step === 'celebration') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-md py-xl gap-lg max-w-2xl mx-auto">
        <div className="text-center space-y-lg">
          {/* Badge with glow effect */}
          <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(217,123,58,0.5)] hearth-skeleton">
            {badge.emoji}
          </div>

          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            🎊 Badge Awarded!
          </h1>
          <p className="font-serif text-text-secondary">
            {selectedLearner.name} earned <strong>{badge.title}</strong>
          </p>
        </div>

        {/* Next steps */}
        <div className="w-full flex flex-col gap-md mt-xl pt-xl border-t border-border-subtle">
          <Link
            href="/demo/dashboard"
            className="block text-center bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-[var(--motion-quick)]"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/demo/our-story/capabilities"
            className="block text-center bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm hover:border-border-medium transition-colors duration-[var(--motion-quick)]"
          >
            View Capabilities
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
