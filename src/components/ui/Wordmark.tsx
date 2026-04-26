'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const LOGOS = [
  '/brand/logo-1.png',
  '/brand/logo-2.png',
  '/brand/logo-3.png',
  '/brand/logo-4.png',
  '/brand/logo-5.png',
] as const;

const ROTATE_MS = 5 * 60 * 1000;
const ASPECT = 566 / 736;

export interface WordmarkProps {
  className?: string;
  textClassName?: string;
  iconHeight?: number;
  showText?: boolean;
}

export function Wordmark({
  className = 'inline-flex items-center gap-sm',
  textClassName = 'font-serif text-xl font-semibold tracking-[0.02em] text-text-primary',
  iconHeight = 28,
  showText = true,
}: WordmarkProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * LOGOS.length));

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOGOS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const width = Math.round(iconHeight * ASPECT);

  return (
    <span className={className}>
      <Image
        key={LOGOS[index]}
        src={LOGOS[index]}
        alt={showText ? '' : 'Hearth'}
        width={width}
        height={iconHeight}
        priority
        className="object-contain transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      />
      {showText && <span className={textClassName}>Hearth</span>}
    </span>
  );
}
