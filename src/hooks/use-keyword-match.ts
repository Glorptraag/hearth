'use client';

import { useEffect, useRef, useState } from 'react';
import { matchKeywords, type KeywordMatchResult } from '@/lib/ai/keyword-matcher';

/** Minimum description length before the matcher runs. */
const KEYWORD_MIN_CHARS = 10;
/** Debounce delay — 1.5 s of idle typing before the match runs. */
const KEYWORD_DEBOUNCE_MS = 1500;

/**
 * Instant keyword matcher for the Logger AI Insights panel. Extracted from
 * `app/(auth)/log/page.tsx`.
 *
 * Behaviour preserved verbatim:
 *  - returns null while the description is shorter than 10 chars;
 *  - debounces 1.5 s of idle typing before running `matchKeywords`;
 *  - re-runs whenever the description or selected child names change.
 *
 * The faster keyword matcher pairs with the slower Haiku draft-insight call
 * (`useDraftInsight`) — both run side-by-side in the page.
 */
export function useKeywordMatch(
  description: string,
  selectedChildNames: string[],
): KeywordMatchResult | null {
  const [keywordMatch, setKeywordMatch] = useState<KeywordMatchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.length < KEYWORD_MIN_CHARS) {
      // Reset stale keyword match when input shrinks below threshold;
      // cleanup-style state reset (null is referentially stable, no loop).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeywordMatch(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setKeywordMatch(matchKeywords(description, selectedChildNames));
    }, KEYWORD_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description, selectedChildNames]);

  return keywordMatch;
}
