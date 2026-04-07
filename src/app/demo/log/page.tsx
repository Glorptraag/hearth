'use client';

import { useState } from 'react';
import DomainChip from '@/components/ui/DomainChip';
import { mockLearners } from '../mock-data';

const ACTIVITY_TYPES = [
  { key: 'free_exploration', label: '🌿 Free Exploration' },
  { key: 'guided_activity', label: '📋 Guided Activity' },
  { key: 'read_aloud', label: '📖 Read Aloud' },
  { key: 'project_work', label: '🔨 Project Work' },
  { key: 'field_trip', label: '🚶 Field Trip' },
  { key: 'creative_play', label: '🎨 Creative Play' },
  { key: 'physical_activity', label: '⚽ Physical Activity' },
  { key: 'life_skills', label: '🏠 Life Skills' },
] as const;

const SUBJECTS = [
  'english', 'mathematics', 'science', 'hass',
  'arts', 'technologies', 'hpe', 'languages',
] as const;

const LEARNER_BORDER: Record<string, string> = {
  rose: 'border-child-rose',
  blue: 'border-child-blue',
  sage: 'border-child-sage',
  violet: 'border-child-violet',
  amber: 'border-child-amber',
};

export default function DemoLog() {
  const [activityType, setActivityType] = useState('free_exploration');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLearners, setSelectedLearners] = useState<string[]>(['1', '2']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dateOccurred, setDateOccurred] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showSuccess, setShowSuccess] = useState(false);

  function toggleLearner(id: string) {
    setSelectedLearners((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleSave() {
    if (!title.trim()) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setTitle('');
      setDescription('');
      setActivityType('free_exploration');
      setSelectedLearners(['1', '2']);
      setSelectedSubjects([]);
      setDateOccurred(new Date().toISOString().split('T')[0]);
    }, 2000);
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-md py-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-[-0.02em] mb-lg">
          Log a moment
        </h1>

        <div className="flex flex-col gap-xl lg:flex-row">
          {/* Main form */}
          <div className="flex-1 space-y-xl">
            {/* Activity type */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                What happened
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {ACTIVITY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActivityType(t.key)}
                    className={`rounded-md px-md py-sm font-sans text-sm border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] text-left ${
                      activityType === t.key
                        ? 'border-ember text-ember bg-ember/10'
                        : 'border-border-subtle text-text-secondary bg-surface-raised hover:border-border-medium'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Give it a name
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Nature journaling at the creek"
                className="w-full bg-surface-raised border border-border-subtle rounded-md px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Tell the story
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you notice?"
                className="w-full bg-surface-raised border border-border-subtle rounded-md px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                When
              </div>
              <input
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="bg-surface-raised border border-border-subtle rounded-md px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Learners */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Learners
              </div>
              <div className="flex flex-wrap gap-sm">
                {mockLearners.map((l) => {
                  const selected = selectedLearners.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLearner(l.id)}
                      className={`flex items-center gap-sm rounded-md px-md py-sm font-sans text-sm border-2 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        selected
                          ? `${LEARNER_BORDER[l.colourToken] ?? 'border-ember'} text-text-primary bg-surface-raised`
                          : 'border-border-subtle text-text-muted hover:border-border-medium'
                      }`}
                    >
                      <span>{l.shapeIcon}</span>
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subjects */}
            <div>
              <div className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Learning areas
              </div>
              <div className="flex flex-wrap gap-sm">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`transition-opacity duration-200 ${
                      selectedSubjects.length === 0 || selectedSubjects.includes(s)
                        ? 'opacity-100'
                        : 'opacity-40'
                    }`}
                  >
                    <DomainChip subject={s} size="md" showEmoji />
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className={`w-full rounded-md bg-ember px-xl py-md font-sans text-base font-semibold text-text-inverse shadow-[0_4px_16px_rgba(217,123,58,0.3)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                title.trim()
                  ? 'hover:bg-ember-hover hover:shadow-[0_8px_32px_rgba(217,123,58,0.4)] hover:translate-y-[-2px]'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Save this moment
            </button>
          </div>

          {/* Right column — AI insight placeholder (desktop only) */}
          <div className="hidden lg:block w-[320px]">
            <div className="sticky top-[80px] bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-soft">
              <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Hearth Voice
              </div>
              <p className="font-serif text-sm text-text-secondary italic leading-relaxed mb-md">
                As you describe what happened, Hearth will suggest capability
                threads and curriculum connections that match your children&apos;s
                learning.
              </p>
              <p className="font-sans text-xs text-text-muted">
                This feature activates when you save.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="bg-surface-panel rounded-lg p-3xl border border-border-subtle shadow-medium text-center">
            <div className="text-5xl mb-lg" aria-hidden="true">✨</div>
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
              Moment captured!
            </h2>
            <p className="font-serif text-sm text-text-secondary">
              The Douglas family&apos;s learning story grows.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
