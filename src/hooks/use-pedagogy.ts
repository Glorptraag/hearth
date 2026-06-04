'use client';

import { useState, useEffect } from 'react';
import { getPedagogyVocabulary } from '@/lib/pedagogy/adapter';
import type { Pedagogy } from '@/types';

type PedagogyVocabulary = ReturnType<typeof getPedagogyVocabulary>;

interface PedagogyState {
  pedagogy: Pedagogy;
  pedagogyPractices: string[];
}

let cachedState: PedagogyState | null = null;

export function usePedagogy(): {
  pedagogy: Pedagogy;
  pedagogyPractices: string[];
  vocab: PedagogyVocabulary;
  loading: boolean;
} {
  const [state, setState] = useState<PedagogyState>(
    cachedState ?? { pedagogy: 'eclectic', pedagogyPractices: [] },
  );
  const [loading, setLoading] = useState(!cachedState);

  useEffect(() => {
    if (cachedState) return;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const next: PedagogyState = {
          pedagogy: (data?.pedagogyPreference ?? 'eclectic') as Pedagogy,
          pedagogyPractices: Array.isArray(data?.pedagogyPractices) ? data.pedagogyPractices : [],
        };
        cachedState = next;
        setState(next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return {
    pedagogy: state.pedagogy,
    pedagogyPractices: state.pedagogyPractices,
    vocab: getPedagogyVocabulary(state.pedagogy),
    loading,
  };
}
