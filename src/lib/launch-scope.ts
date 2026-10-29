import { redirect } from 'next/navigation';

/**
 * Expo launch scope hides surfaces cut from the expo build (Module Builder,
 * Planner, Marketplace, badges). Nothing is deleted; unset the env var to restore.
 */
export function isExpoScope(): boolean {
  return process.env.NEXT_PUBLIC_LAUNCH_SCOPE === 'expo';
}

/** Server-side route guard: call from a layout of a cut surface. */
export function redirectIfExpoScope(to = '/dashboard'): void {
  if (isExpoScope()) redirect(to);
}
