'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { resolveCopy, type CopyOverrides } from './resolve';
import type { CopyBundle, CopySurface } from './defaults';

/**
 * Distributes Sanity copy OVERRIDES to client components.
 *
 * The root layout fetches overrides once per request (`fetchCopyOverrides`)
 * and mounts this provider. Client components call `useCopy(surface)` and get
 * the full resolved bundle — defaults come from the JS bundle, so the context
 * payload is only the diff. Without a provider (unit tests, dev-preview,
 * storybook-style harnesses) the hook returns the code defaults.
 */
const CopyContext = createContext<CopyOverrides>({});

export function CopyProvider({
  overrides,
  children,
}: {
  overrides: CopyOverrides;
  children: ReactNode;
}) {
  return <CopyContext.Provider value={overrides}>{children}</CopyContext.Provider>;
}

export function useCopy<S extends CopySurface>(surface: S): CopyBundle<S> {
  const overrides = useContext(CopyContext);
  return useMemo(() => resolveCopy(surface, overrides), [surface, overrides]);
}
