'use client';

import { useState, useEffect } from 'react';
import { getPedagogyVocabulary } from '@/lib/pedagogy/adapter';
import type { Pedagogy } from '@/types';

type PedagogyVocabulary = ReturnType<typeof getPedagogyVocabulary>;

let cachedPedagogy: Pedagogy | null = null;

export function usePedagogy(): { pedagogy: Pedagogy; vocab: PedagogyVocabulary; loading: boolean } {
  const [pedagogy, setPedagogy] = useState<Pedagogy>(cachedPedagogy ?? 'eclectic');
  const [loading, setLoading] = useState(!cachedPedagogy);

  useEffect(() => {
    if (cachedPedagogy) return;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const p = (data?.pedagogyPreference ?? 'eclectic') as Pedagogy;
        cachedPedagogy = p;
        setPedagogy(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { pedagogy, vocab: getPedagogyVocabulary(pedagogy), loading };
}
