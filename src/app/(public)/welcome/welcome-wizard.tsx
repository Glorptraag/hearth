'use client';

import { useState, useEffect, useRef, useCallback, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import {
  House,
  NotePencil,
  Sparkle,
  Books,
  ShieldCheck,
  Flame,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number }>;

const slides: Array<{ Icon: IconC; title: string; body: string }> = [
  {
    Icon: House,
    title: 'Welcome to Hearth',
    body: "You just made one of the most important decisions for your family\u2019s education. This is your home base \u2014 let\u2019s show you around.",
  },
  {
    Icon: NotePencil,
    title: 'Capture learning as it happens',
    body: 'Had a great morning? Open the Logger, describe what happened, and Hearth handles the rest. AI spots the learning, maps the capabilities, builds the evidence. Under two minutes.',
  },
  {
    Icon: Sparkle,
    title: "See what they\u2019re really learning",
    body: "Every logged moment feeds the Capabilities Constellation, a living map of your child\u2019s growth across eight domains. An afternoon at the creek shows up as science, observation, and storytelling at once.",
  },
  {
    Icon: Books,
    title: 'Activities shaped by your approach',
    body: "Structured packs, spontaneous modules, and everything in between \u2014 all filtered through your family\u2019s educational philosophy. Charlotte Mason, Classical, Montessori, or your own blend.",
  },
  {
    Icon: ShieldCheck,
    title: 'Reporting, handled',
    body: 'Portfolio evidence, capability coverage, work sample curation \u2014 Hearth produces the documentation you need. No stress, no last-minute scramble.',
  },
  {
    Icon: Flame,
    title: 'Set up your family',
    body: "Set up your family profile and add your learners. It takes about two minutes.",
  },
];

export default function WelcomeWizard() {
  const [current, setCurrent] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const router = useRouter();
  const touchStartX = useRef(0);

  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  const complete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await fetch('/api/welcome/complete', { method: 'POST' });
      router.push('/onboarding');
    } catch {
      setIsCompleting(false);
    }
  }, [isCompleting, router]);

  const next = useCallback(() => {
    if (isLast) {
      complete();
    } else {
      setCurrent((c) => c + 1);
      setAnimKey((k) => k + 1);
    }
  }, [isLast, complete]);

  const prev = useCallback(() => {
    if (!isFirst) {
      setCurrent((c) => c - 1);
      setAnimKey((k) => k + 1);
    }
  }, [isFirst]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') complete();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev, complete]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }

  const slide = slides[current];

  return (
    <main
      className="flex min-h-screen items-center justify-center px-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(217,123,58,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(217,123,58,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-[24px] border border-border-subtle bg-surface-panel shadow-float">
        {/* Skip */}
        <button
          onClick={complete}
          disabled={isCompleting}
          className="absolute right-md top-md z-10 rounded-[6px] px-sm py-xs font-sans text-xs font-medium text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary"
        >
          Skip
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-sm px-lg pt-lg">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                i === current
                  ? 'bg-ember shadow-[0_0_8px_rgba(217,123,58,0.4)]'
                  : i < current
                    ? 'bg-sage shadow-[0_0_6px_rgba(123,191,138,0.30)]'
                    : 'bg-surface-raised'
              }`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="flex min-h-[320px] flex-col items-center justify-center px-xl py-2xl text-center max-[520px]:min-h-[280px] max-[520px]:px-lg max-[520px]:py-xl">
          <div
            key={animKey}
            className="flex flex-col items-center animate-[slideIn_var(--motion-gentle)_var(--ease-default)]"
          >
            <div
              className="mb-lg inline-flex items-center justify-center text-ember"
              aria-hidden="true"
            >
              <slide.Icon size={32} />
            </div>
            <h2 className="mb-md font-serif text-[1.4rem] font-semibold leading-[1.3] text-text-primary max-[520px]:text-xl">
              {slide.title}
            </h2>
            <p className="max-w-[380px] font-serif text-[0.95rem] leading-relaxed text-text-secondary">
              {slide.body}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-sm px-xl pb-xl">
          {!isFirst && (
            <button
              onClick={prev}
              className="rounded-[10px] border border-border-subtle bg-surface-raised px-lg py-md font-sans text-sm font-medium text-text-secondary transition duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-surface-hover hover:text-text-primary"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? complete : next}
            disabled={isCompleting}
            className="hearth-press flex-1 rounded-[10px] bg-ember px-lg py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember hover:bg-ember-hover hover:-translate-y-px hover:shadow-ember-strong disabled:opacity-60"
          >
            {isCompleting ? 'Loading…' : isLast ? 'Set up my family' : 'Next'}
          </button>
        </div>

        {/* Brand */}
        <div className="flex justify-center pb-lg">
          <Wordmark
            iconHeight={18}
            textClassName="font-serif text-[0.8rem] font-semibold text-text-muted"
          />
        </div>
      </div>
    </main>
  );
}
