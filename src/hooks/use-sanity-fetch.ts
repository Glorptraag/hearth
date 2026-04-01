'use client';

import { useCallback, useEffect, useState } from 'react';
import { sanityClient } from '@/lib/sanity/client';

interface UseSanityFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

export function useSanityFetch<T>(
  query: string,
  params?: Record<string, unknown>,
): UseSanityFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await sanityClient.fetch<T>(query, params);
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [query, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}
