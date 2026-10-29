import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PrepMode from './PrepMode';
import type { Module } from './types';

// Regression for Sentry HEARTH-9 ("null is not an object (evaluating 'e.title')"
// on /module/:id). A capabilityThread ref that doesn't resolve — a dangling ref
// to a deleted/unpublished thread, or a tokenless read — derefs to a null array
// element. PrepMode renders for every module before facilitation, so a single
// null in module.capabilityThreads crashed the whole runner -> "Try again". The
// GROQ `defined(@->_id)` guard drops them at read time; this guards the component
// too, so a stray null can never re-crash the runner.
describe('PrepMode — resilient to unresolved (null) capabilityThread refs', () => {
  const moduleWithNullThreads = {
    _id: 'm1',
    title: 'Reasons and Evidence',
    targetUnderstanding: 'Claims need reasons and evidence.',
    approaches: [
      {
        _id: 'a1',
        title: 'Discuss',
        modality: 'social',
        activities: [{ _id: 'act1', title: 'Make a claim' }],
      },
    ],
    // Exactly what an unresolved 3-thread module yields.
    capabilityThreads: [null, null, null],
  } as unknown as Module;

  it('renders without throwing when every capabilityThread ref is null', () => {
    expect(() =>
      render(<PrepMode module={moduleWithNullThreads} approachIdx={0} onStart={() => {}} />),
    ).not.toThrow();
  });

  it('still renders resolvable threads and skips the null ones', () => {
    const mixed = {
      ...moduleWithNullThreads,
      capabilityThreads: [null, { _id: 't1', title: 'Critical Thinking', domain: 'thinking' }, null],
    } as unknown as Module;
    const { getByText } = render(
      <PrepMode module={mixed} approachIdx={0} onStart={() => {}} />,
    );
    expect(getByText('Critical Thinking')).toBeTruthy();
  });
});
