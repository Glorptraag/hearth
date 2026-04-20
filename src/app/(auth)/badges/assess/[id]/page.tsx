'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { track } from '@/lib/analytics/posthog';

type AssessmentQuestion = { id: string; question: string };
type BadgeData = {
  id: string;
  title: string;
  emoji: string;
  threadName: string;
  assessmentQuestions: AssessmentQuestion[];
};
type Response = { questionId: string; response: 'yes' | 'sometimes' | 'not_yet'; note?: string };

type AssessmentLog = {
  id: string;
  responses: Response[];
  outcome: string;
  assessedAt: string;
};

type Step = 'intro' | 'questions' | 'decision' | 'celebration' | 'deferred' | 'compare';

export default function BadgeAssessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const badgeId = params.id as string;
  const learnerId = searchParams.get('learner') ?? '';
  const learnerName = searchParams.get('name') ?? 'your child';

  // Queue support: parent may arrive with multiple ready badges.
  // Format: ?queue=badgeId:learnerId,badgeId:learnerId
  const queueParam = searchParams.get('queue') ?? '';
  const queueItems = queueParam
    ? queueParam
        .split(',')
        .map((s) => {
          const [bid, lid] = s.split(':');
          return bid && lid ? { badgeId: bid, learnerId: lid } : null;
        })
        .filter((x): x is { badgeId: string; learnerId: string } => x !== null)
    : [];
  const hasQueue = queueItems.length > 0;
  const queueTotal = queueItems.length + 1; // +1 for the current badge
  const queuePosition = 1; // this badge is always position 1 within the remaining walk

  const goToNextInQueue = useCallback(async () => {
    if (!hasQueue) return;
    const [next, ...rest] = queueItems;
    // Fetch learner name for next badge (may be a different child)
    let nextName = '';
    try {
      const res = await fetch('/api/learners');
      if (res.ok) {
        const all: Array<{ id: string; name: string }> = await res.json();
        nextName = all.find((l) => l.id === next.learnerId)?.name ?? '';
      }
    } catch {
      // fall through — url still works without name
    }
    const restParam = rest.length > 0
      ? `&queue=${rest.map((r) => `${r.badgeId}:${r.learnerId}`).join(',')}`
      : '';
    router.push(
      `/badges/assess/${next.badgeId}?learner=${next.learnerId}&name=${encodeURIComponent(nextName)}${restParam}`
    );
  }, [hasQueue, queueItems, router]);

  const [step, setStep] = useState<Step>('intro');
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousAssessments, setPreviousAssessments] = useState<AssessmentLog[]>([]);

  useEffect(() => {
    fetch(`/api/badges/${badgeId}`)
      .then((r) => r.json())
      .then((data) => {
        setBadge(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load badge');
        setLoading(false);
      });

    if (learnerId) {
      fetch(`/api/badges/history?badgeId=${badgeId}&learnerId=${learnerId}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setPreviousAssessments(data);
        })
        .catch(() => {});
    }
  }, [badgeId, learnerId]);

  const personalize = useCallback(
    (text: string) => text.replace(/\[child\]/gi, learnerName),
    [learnerName]
  );

  const yesCount = responses.filter((r) => r.response === 'yes').length;
  const totalQ = badge?.assessmentQuestions.length ?? 0;
  const mostlyYes = yesCount >= Math.ceil(totalQ / 2);

  const handleResponse = (response: 'yes' | 'sometimes' | 'not_yet') => {
    const q = badge!.assessmentQuestions[currentQ];
    setResponses((prev) => {
      const next = prev.filter((r) => r.questionId !== q.id);
      return [...next, { questionId: q.id, response }];
    });

    if (currentQ < totalQ - 1) {
      setCurrentQ((c) => c + 1);
    } else {
      setStep('decision');
    }
  };

  const handleAward = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/badges/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, learnerId, responses }),
      });
      if (!res.ok) throw new Error();
      track('badge_awarded', { from_queue: hasQueue, queue_remaining: queueItems.length });
      setStep('celebration');
    } catch {
      setError('Failed to award badge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDefer = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/badges/defer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, learnerId, responses }),
      });
      if (!res.ok) throw new Error();
      track('badge_deferred', { from_queue: hasQueue, queue_remaining: queueItems.length });
      setStep('deferred');
    } catch {
      setError('Failed to defer badge');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-body flex items-center justify-center">
        <p className="font-sans text-text-secondary animate-pulse">Loading assessment...</p>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-surface-body flex items-center justify-center px-md">
        <div className="text-center">
          <p className="font-serif text-text-primary text-xl mb-md">{error ?? 'Badge not found'}</p>
          <button
            onClick={() => router.back()}
            className="font-sans text-sm text-ember hover:text-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-body">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 80%, rgba(217,123,58,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(217,123,58,0.08) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-md py-lg">
        {/* Header */}
        {step !== 'celebration' && step !== 'deferred' && step !== 'compare' && (
          <header className="flex items-center justify-between mb-xl">
            <button
              onClick={() => {
                if (step === 'questions' && currentQ > 0) {
                  setCurrentQ((c) => c - 1);
                } else if (step === 'questions') {
                  setStep('intro');
                } else if (step === 'decision') {
                  setCurrentQ(totalQ - 1);
                  setStep('questions');
                } else {
                  router.back();
                }
              }}
              className="font-sans text-sm text-text-secondary hover:text-text-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              ← Back
            </button>

            {/* Progress dots */}
            {step === 'questions' && (
              <div className="flex gap-sm">
                {badge.assessmentQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      i < currentQ
                        ? 'bg-ember'
                        : i === currentQ
                          ? 'bg-ember shadow-[0_0_8px_rgba(217,123,58,0.4)]'
                          : 'bg-surface-raised'
                    }`}
                  />
                ))}
              </div>
            )}

            {hasQueue ? (
              <span className="font-sans text-xs text-text-muted">
                Badge {queuePosition} of {queueTotal}
              </span>
            ) : (
              <div className="w-12" />
            )}
          </header>
        )}

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="text-center pt-2xl">
            <div className="w-24 h-24 mx-auto mb-lg rounded-full bg-surface-panel border border-border-subtle flex items-center justify-center text-5xl shadow-glow">
              {badge.emoji}
            </div>
            <p className="font-sans text-xs uppercase tracking-widest text-text-muted mb-sm">
              {badge.threadName}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">
              {badge.title}
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed mb-2xl max-w-sm mx-auto">
              Based on what you&apos;ve been logging, {learnerName} might be ready for the{' '}
              <span className="text-ember">{badge.title}</span> badge. Let&apos;s check together.
            </p>

            <div className="space-y-sm">
              <button
                onClick={() => setStep('questions')}
                className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                Let&apos;s check
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* ── QUESTIONS ── */}
        {step === 'questions' && (
          <div className="pt-lg">
            {/* Queue indicator */}
            {(() => {
              const queuePosition = parseInt(searchParams.get('pos') ?? '1', 10);
              const queueTotal = parseInt(searchParams.get('total') ?? '1', 10);
              return queueTotal > 1 ? (
                <div className="mb-md rounded-lg border border-border-subtle bg-surface-panel px-md py-sm flex items-center justify-between">
                  <p className="font-sans text-xs text-text-muted">
                    Badge <span className="font-semibold text-text-primary">{queuePosition}</span> of <span className="font-semibold text-text-primary">{queueTotal}</span>
                  </p>
                  <span className="font-sans text-xs text-ember">{queueTotal - queuePosition} more after this</span>
                </div>
              ) : null;
            })()}
            <p className="font-sans text-xs text-text-muted mb-sm">
              Question {currentQ + 1} of {totalQ}
            </p>
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-xl leading-relaxed">
              {personalize(badge.assessmentQuestions[currentQ].question)}
            </h2>

            <div className="space-y-sm">
              <ResponseOption
                label="Yes, consistently"
                sublabel="This is a regular thing"
                selected={responses.find((r) => r.questionId === badge.assessmentQuestions[currentQ].id)?.response === 'yes'}
                onClick={() => handleResponse('yes')}
                variant="yes"
              />
              <ResponseOption
                label="Sometimes"
                sublabel="It happens, but not always"
                selected={responses.find((r) => r.questionId === badge.assessmentQuestions[currentQ].id)?.response === 'sometimes'}
                onClick={() => handleResponse('sometimes')}
                variant="sometimes"
              />
              <ResponseOption
                label="Not yet"
                sublabel="We haven't seen this"
                selected={responses.find((r) => r.questionId === badge.assessmentQuestions[currentQ].id)?.response === 'not_yet'}
                onClick={() => handleResponse('not_yet')}
                variant="not_yet"
              />
            </div>
          </div>
        )}

        {/* ── DECISION ── */}
        {step === 'decision' && (
          <div className="pt-lg text-center">
            <div className="text-5xl mb-lg">{badge.emoji}</div>

            {/* Response summary */}
            <div className="bg-surface-panel rounded-lg border border-border-subtle p-lg mb-xl text-left">
              <h3 className="font-sans text-xs uppercase tracking-widest text-text-muted mb-md">
                Your responses
              </h3>
              <div className="space-y-sm">
                {badge.assessmentQuestions.map((q) => {
                  const r = responses.find((r) => r.questionId === q.id);
                  const icon = r?.response === 'yes' ? '✅' : r?.response === 'sometimes' ? '🟡' : '⬜';
                  return (
                    <div key={q.id} className="flex items-start gap-sm">
                      <span className="text-sm mt-0.5">{icon}</span>
                      <p className="font-serif text-sm text-text-secondary">
                        {personalize(q.question)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {mostlyYes ? (
              <>
                <div className="inline-flex items-center gap-xs rounded-full border border-sage/30 bg-sage/10 px-md py-xs font-sans text-xs font-semibold text-sage mb-md">
                  ✓ Looking good
                </div>
                <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
                  It looks like {learnerName} has earned {badge.title}!
                </h2>
                <p className="font-serif text-text-secondary mb-xl">
                  Ready to make it official?
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-xs rounded-full border border-ember/30 bg-ember-glow px-md py-xs font-sans text-xs font-semibold text-ember mb-md">
                  Your call
                </div>
                <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
                  Not quite yet
                </h2>
                <p className="font-serif text-text-secondary mb-xl">
                  Would you like to award <span className="text-ember">{badge.title}</span> now, or
                  give it more time?
                </p>
              </>
            )}

            <div className="space-y-sm">
              <button
                onClick={handleAward}
                disabled={submitting}
                className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover disabled:opacity-50 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                {submitting ? 'Awarding...' : `Award ${badge.title}`}
              </button>
              <div className="flex flex-col gap-sm">
                <button
                  onClick={handleDefer}
                  disabled={submitting}
                  className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium disabled:opacity-50 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  Not yet — we&apos;ll check again later
                </button>
                <button
                  onClick={handleDefer}
                  disabled={submitting}
                  className="font-sans text-xs font-medium text-text-muted hover:text-text-secondary transition-colors duration-200"
                >
                  Not ready yet · defer 7 days
                </button>
              </div>
              {previousAssessments.length > 0 && (
                <button
                  onClick={() => setStep('compare')}
                  className="w-full mt-sm font-sans text-xs text-text-muted hover:text-ember border border-border-subtle rounded-md px-md py-sm transition-all duration-200 hover:border-border-medium"
                >
                  Compare with previous assessment ({previousAssessments.length} prior)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── COMPARE ── */}
        {step === 'compare' && badge && (() => {
          const prev = previousAssessments[0];
          if (!prev) return null;
          const prevResponses = prev.responses as Response[];
          const RESPONSE_LABELS: Record<string, { icon: string; label: string; rank: number }> = {
            yes: { icon: '✅', label: 'Yes', rank: 2 },
            sometimes: { icon: '🟡', label: 'Sometimes', rank: 1 },
            not_yet: { icon: '⬜', label: 'Not yet', rank: 0 },
          };

          return (
            <div className="pt-lg">
              <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm text-center">
                Assessment Comparison
              </h2>
              <p className="font-serif text-sm text-text-secondary text-center mb-xl">
                {learnerName}&apos;s progress on {badge.title}
              </p>

              <div className="bg-surface-panel rounded-lg border border-border-subtle overflow-hidden mb-xl">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_80px_40px] gap-sm px-md py-sm border-b border-border-subtle bg-surface-raised">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-text-muted">Question</span>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-text-muted text-center">
                    {new Date(prev.assessedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-text-muted text-center">Now</span>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-text-muted text-center">Δ</span>
                </div>

                {/* Rows */}
                {badge.assessmentQuestions.map((q) => {
                  const prevR = prevResponses.find((r) => r.questionId === q.id);
                  const currR = responses.find((r) => r.questionId === q.id);
                  const prevMeta = RESPONSE_LABELS[prevR?.response ?? 'not_yet'];
                  const currMeta = RESPONSE_LABELS[currR?.response ?? 'not_yet'];
                  const delta = currMeta.rank - prevMeta.rank;
                  const deltaIcon = delta > 0 ? '📈' : delta < 0 ? '📉' : '—';
                  const deltaColor = delta > 0 ? 'text-sage' : delta < 0 ? 'text-amber-400' : 'text-text-muted';

                  return (
                    <div key={q.id} className="grid grid-cols-[1fr_80px_80px_40px] gap-sm px-md py-md border-b border-border-subtle last:border-0">
                      <p className="font-serif text-sm text-text-secondary leading-snug">
                        {personalize(q.question)}
                      </p>
                      <div className="flex items-center justify-center">
                        <span className="text-sm">{prevMeta.icon}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm">{currMeta.icon}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className={`text-sm ${deltaColor}`}>{deltaIcon}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {(() => {
                const improvements = badge.assessmentQuestions.filter((q) => {
                  const prevR = prevResponses.find((r) => r.questionId === q.id);
                  const currR = responses.find((r) => r.questionId === q.id);
                  return (RESPONSE_LABELS[currR?.response ?? 'not_yet'].rank) > (RESPONSE_LABELS[prevR?.response ?? 'not_yet'].rank);
                }).length;
                return improvements > 0 ? (
                  <div className="rounded-lg border border-sage/30 bg-sage/10 p-md mb-xl text-center">
                    <p className="font-serif text-sm text-sage">
                      {improvements} area{improvements !== 1 ? 's' : ''} showing growth since last assessment
                    </p>
                  </div>
                ) : null;
              })()}

              <div className="space-y-sm">
                <button
                  onClick={() => setStep('decision')}
                  className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200"
                >
                  Back to decision
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── CELEBRATION ── */}
        {step === 'celebration' && (
          <div className="pt-2xl text-center">
            <div className="w-32 h-32 mx-auto mb-lg rounded-full bg-surface-panel border-2 border-ember flex items-center justify-center text-7xl shadow-[0_0_60px_rgba(217,123,58,0.35),0_0_120px_rgba(217,123,58,0.15)]">
              {badge.emoji}
            </div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary mb-sm">
              {learnerName} earned {badge.title}!
            </h1>
            <p className="font-serif text-text-secondary mb-2xl">
              This badge is now part of {learnerName}&apos;s learning story.
            </p>

            <div className="space-y-sm">
              {hasQueue ? (
                <>
                  <button
                    onClick={goToNextInQueue}
                    className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Next badge ({queueItems.length} remaining) →
                  </button>
                  <button
                    onClick={() => router.push('/our-story/portfolio')}
                    className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Stop here · View in Portfolio
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/our-story/portfolio')}
                    className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    View in Portfolio
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Back to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── DEFERRED ── */}
        {step === 'deferred' && (
          <div className="pt-2xl text-center">
            <div className="text-6xl mb-lg" aria-hidden="true">🌱</div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary mb-sm">
              Still growing
            </h1>
            <p className="font-serif text-text-secondary leading-relaxed mb-2xl max-w-sm mx-auto">
              No rush — {learnerName} is making progress. We&apos;ll check in again when the time
              feels right.
            </p>

            <div className="space-y-sm">
              {hasQueue ? (
                <>
                  <button
                    onClick={goToNextInQueue}
                    className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Next badge ({queueItems.length} remaining) →
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Stop here · Back to Dashboard
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-transparent border border-border-subtle text-text-secondary font-sans rounded-md px-md py-sm hover:border-border-medium transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResponseOption({
  label,
  sublabel,
  selected,
  onClick,
  variant,
}: {
  label: string;
  sublabel: string;
  selected: boolean;
  onClick: () => void;
  variant: 'yes' | 'sometimes' | 'not_yet';
}) {
  const borderClass = selected
    ? variant === 'yes'
      ? 'border-ember bg-[rgba(217,123,58,0.08)]'
      : 'border-border-medium bg-surface-hover'
    : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:bg-surface-hover';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-lg transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${borderClass}`}
    >
      <p className="font-serif font-semibold text-text-primary">{label}</p>
      <p className="font-sans text-sm text-text-muted mt-xs">{sublabel}</p>
    </button>
  );
}
