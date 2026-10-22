import type { ReactNode } from 'react';
import { redirectIfExpoScope } from '@/lib/launch-scope';

export default function CutSurfaceLayout({ children }: { children: ReactNode }) {
  redirectIfExpoScope();
  return <>{children}</>;
}
