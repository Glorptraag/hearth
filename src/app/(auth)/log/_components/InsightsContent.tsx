import {
  Sparkle,
  Plant,
  BookOpenUser,
  ChatCircleDots,
  MagnifyingGlass,
  Ruler,
  TrendUp,
  Note,
  User,
} from '@/components/icons';
import type { KeywordMatchResult, ReflectionPrompt } from '@/lib/ai/keyword-matcher';
import type { DraftInsight } from '@/lib/ai/draft-insight';
import type { CoachHint } from '@/lib/logger/coaching/types';

/**
 * The Logger's right-rail "insights" panel — the live, pre-save reflection
 * surface. Renders, in priority order: the Haiku reflection, post-save
 * enrichment insights, the profile nudge, in-flight coach hints, reflection
 * prompts, and the instant keyword detections (subjects / threads / engagement /
 * mentioned children). Extracted verbatim from log/page.tsx; pure presentation
 * driven entirely by props.
 */

const THREAD_LABELS: Record<string, string> = {
  L1: 'Oral Communication', L2: 'Phonological Awareness', L3: 'Reading Comprehension',
  L4: 'Vocabulary', L5: 'Written Expression', L6: 'Spelling & Grammar',
  L7: 'Narrative', L8: 'Persuasion', L9: 'Literary Appreciation',
  M1: 'Number Sense', M2: 'Operations', M3: 'Fractional Thinking',
  M4: 'Algebraic Thinking', M5: 'Measurement', M6: 'Spatial Reasoning',
  M7: 'Data & Statistics', M8: 'Probability', M9: 'Mathematical Modelling',
  S1: 'Scientific Inquiry', S2: 'Biological Sciences', S3: 'Chemical Sciences',
  S4: 'Physical Sciences', S5: 'Scientific Observation', S6: 'Earth & Space',
  H1: 'Historical Understanding', H2: 'Source Analysis', H3: 'Geographical Understanding',
  H4: 'Civics & Citizenship', H5: 'Economics & Business', H6: 'Cultural Understanding',
  P1: 'Gross Motor', P2: 'Fine Motor', P3: 'Body Awareness', P4: 'Team & Sport', P5: 'Aquatics',
  PS1: 'Empathy', PS2: 'Social Skills', PS3: 'Self-Regulation', PS4: 'Identity',
  PS5: 'Responsibility', PS6: 'Resilience', PS7: 'Safety',
  C1: 'Visual Art', C2: 'Music', C3: 'Drama', C4: 'Dance', C5: 'Media Arts',
  C6: 'Design & Construction', C7: 'Arts Appreciation',
  EF1: 'Sustained Attention', EF2: 'Working Memory', EF3: 'Cognitive Flexibility',
  EF4: 'Planning', EF5: 'Critical Thinking', EF6: 'Collaboration',
  EF7: 'Metacognition', EF8: 'Transfer',
};

export function InsightsContent({
  match,
  aiInsight,
  aiLoading,
  reflectionPrompts,
  coachHints,
  profileNudge,
  postSaveInsights,
}: {
  match: KeywordMatchResult | null;
  aiInsight: DraftInsight | null;
  aiLoading: boolean;
  reflectionPrompts: ReflectionPrompt[];
  coachHints: CoachHint[];
  profileNudge: { text: string; thread_id: string } | null;
  postSaveInsights: string[];
}) {
  const hasDetections =
    !!match &&
    (match.subjects.length > 0 ||
      match.threads.length > 0 ||
      !!match.engagement ||
      match.mentionedChildren.length > 0);

  // Blank state — no description typed yet, nothing post-save, no AI reflection
  if (!match && !aiInsight && postSaveInsights.length === 0) {
    return (
      <div className="flex flex-col gap-md">
        <div className="flex flex-col items-center justify-center py-xl text-center">
          <span className="text-4xl mb-md opacity-30" aria-hidden="true">🙂</span>
          <p className="font-serif text-sm text-text-muted italic leading-relaxed">
            Start describing the activity and Hearth will find the learning within it.
          </p>
        </div>
        <div className="rounded-md bg-surface-raised border border-border-subtle p-md">
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-text-muted mb-xs">Good descriptions include</p>
          <ul className="space-y-xs">
            {[
              'What they were doing and thinking',
              'A specific moment that surprised you',
              'Something they said or asked',
              'How they responded to a challenge',
            ].map((hint) => (
              <li key={hint} className="font-serif text-[0.8125rem] text-text-muted leading-snug">· {hint}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-md">
      {/* AI reflection — one warm sentence from Haiku (pre-save hero) */}
      {aiInsight?.reflection && (
        <div className="rounded-[10px] border border-ember/20 bg-ember-glow p-md">
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-ember mb-xs">
            Hearth is noticing
          </p>
          <p className="font-serif text-sm italic leading-relaxed text-text-primary">
            {aiInsight.reflection}
          </p>
        </div>
      )}
      {!aiInsight?.reflection && aiLoading && (
        <div className="rounded-[10px] border border-border-subtle bg-surface-raised p-md">
          <p className="font-sans text-xs text-text-muted italic">
            Reading what you&apos;re writing…
          </p>
        </div>
      )}

      {/* Post-save insights from Haiku enrichment */}
      {postSaveInsights.length > 0 && (
        <div className="rounded-md bg-ember/[0.07] border border-ember/20 p-md">
          <p className="inline-flex items-center gap-xs font-sans text-[10px] uppercase tracking-[0.1em] text-ember mb-sm font-semibold">
            <Sparkle size={12} aria-hidden="true" /> Hearth noticed
          </p>
          <div className="space-y-sm">
            {postSaveInsights.map((s, i) => (
              <p key={i} className="font-serif text-sm text-text-secondary leading-relaxed">
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Post-save profile nudge */}
      {profileNudge && (
        <div className="rounded-md bg-sage/[0.07] border border-sage/20 p-md">
          <p className="inline-flex items-center gap-xs font-sans text-[10px] uppercase tracking-[0.1em] text-sage mb-sm font-semibold">
            <Plant size={12} aria-hidden="true" /> Next time, try noticing…
          </p>
          <p className="font-serif text-sm text-text-secondary leading-relaxed">
            {profileNudge.text}
          </p>
        </div>
      )}

      {/* In-flight coach hints from PKB retrieval */}
      {coachHints.length > 0 && (
        <div className="space-y-sm">
          <p className="inline-flex items-center gap-xs font-sans text-[10px] uppercase tracking-[0.1em] text-text-muted font-semibold">
            <BookOpenUser size={12} aria-hidden="true" /> From your pedagogy notes
          </p>
          {coachHints.map((hint) => (
            <div key={hint.id} className="rounded-md border border-border-subtle bg-surface-raised p-sm">
              <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">{hint.title}</p>
              <p className="font-serif text-[0.8125rem] text-text-secondary leading-relaxed">{hint.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reflection prompts — shown when description is in progress */}
      {reflectionPrompts.length > 0 && (
        <div className="space-y-sm">
          <p className="inline-flex items-center gap-xs font-sans text-[10px] uppercase tracking-[0.1em] text-text-muted font-semibold">
            <ChatCircleDots size={12} aria-hidden="true" /> Go deeper
          </p>
          {reflectionPrompts.map((prompt) => (
            <div key={prompt.id} className="rounded-md border border-border-subtle bg-surface-raised p-sm">
              <p className="font-serif text-[0.8125rem] text-text-secondary leading-relaxed italic">
                {prompt.question}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Description written but no learning signals found */}
      {match && !hasDetections && reflectionPrompts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-xl text-center">
          <span className="mb-md inline-flex opacity-30 text-text-secondary" aria-hidden="true"><MagnifyingGlass size={32} /></span>
          <p className="font-serif text-sm text-text-muted italic leading-relaxed">
            Keep going — try adding what they were thinking about or working out.
          </p>
        </div>
      )}

      {/* Learning signal detections */}
      {hasDetections && match && (
        <>
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-text-muted">
            Preliminary — confirmed after save
          </p>

          {match.subjects.length > 0 && (
            <div>
              <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Subjects detected</p>
              <div className="flex flex-wrap gap-xs">
                {match.subjects.map((s) => (
                  <span key={s} className="inline-flex items-center gap-xs rounded-full bg-ember-glow border border-ember/20 px-sm py-xs font-sans text-xs text-text-primary">
                    <Ruler size={12} aria-hidden="true" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {match.threads.length > 0 && (
            <div>
              <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Capability threads</p>
              <div className="flex flex-wrap gap-xs">
                {match.threads.slice(0, 6).map((t) => (
                  <span key={t} className="inline-flex items-center gap-xs rounded-full bg-sage/10 border border-sage/20 px-sm py-xs font-sans text-xs text-text-primary">
                    <Plant size={12} aria-hidden="true" /> {THREAD_LABELS[t] ?? t}
                  </span>
                ))}
                {match.threads.length > 6 && (
                  <span className="font-sans text-xs text-text-muted">+{match.threads.length - 6} more</span>
                )}
              </div>
            </div>
          )}

          {match.engagement && (
            <div>
              <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Engagement tone</p>
              <span className={`rounded-full px-sm py-xs font-sans text-xs ${
                match.engagement === 'positive'
                  ? 'bg-sage/10 border border-sage/20 text-sage'
                  : match.engagement === 'challenging'
                    ? 'bg-red-900/10 border border-red-900/20 text-red-400'
                    : 'bg-surface-raised border border-border-subtle text-text-secondary'
              }`}>
                {match.engagement === 'positive'
                  ? <span className="inline-flex items-center gap-xs"><Sparkle size={12} aria-hidden="true" /> Deep engagement</span>
                  : match.engagement === 'challenging'
                  ? <span className="inline-flex items-center gap-xs"><TrendUp size={12} aria-hidden="true" /> Growth moment</span>
                  : <span className="inline-flex items-center gap-xs"><Note size={12} aria-hidden="true" /> Steady participation</span>}
              </span>
            </div>
          )}

          {match.mentionedChildren.length > 0 && (
            <div>
              <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Children mentioned</p>
              <div className="flex flex-wrap gap-xs">
                {match.mentionedChildren.map((name) => (
                  <span key={name} className="inline-flex items-center gap-xs rounded-full bg-surface-raised border border-border-subtle px-sm py-xs font-sans text-xs text-text-primary">
                    <User size={12} aria-hidden="true" /> {name} mentioned
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
