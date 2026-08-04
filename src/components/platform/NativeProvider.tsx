'use client';

import { createContext, useContext } from 'react';

/**
 * Carries the server's native/web verdict to client components.
 *
 * The value is resolved once per request in the root layout (a server
 * component) via `isNativeRequest()` and passed down. Client components must
 * read it from here rather than sniffing `window.Capacitor` themselves — a
 * global read during render would disagree with the server's HTML and produce
 * a hydration mismatch on exactly the surfaces (purchase CTAs) where being
 * wrong is an App Store problem.
 *
 * Defaults to `false`: web is the safe default, since it only ever *adds*
 * purchase affordances that native must not show.
 */
const NativeContext = createContext(false);

export function NativeProvider({
  isNative,
  children,
}: {
  isNative: boolean;
  children: React.ReactNode;
}) {
  return <NativeContext.Provider value={isNative}>{children}</NativeContext.Provider>;
}

/** True when running inside the Capacitor shell. */
export function useIsNative(): boolean {
  return useContext(NativeContext);
}
