import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CopyProvider, useCopy } from './index';

describe('useCopy', () => {
  it('returns code defaults with no provider', () => {
    const { result } = renderHook(() => useCopy('auth'));
    expect(result.current['nav.signIn']).toBe('Sign In');
  });

  it('merges provider overrides over defaults', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CopyProvider overrides={{ auth: { 'nav.signIn': 'Log in' } }}>{children}</CopyProvider>
    );
    const { result } = renderHook(() => useCopy('auth'), { wrapper });
    expect(result.current['nav.signIn']).toBe('Log in');
    expect(result.current['nav.getStarted']).toBe('Get Started');
  });
});
