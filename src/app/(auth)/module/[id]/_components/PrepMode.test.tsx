import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PrepMode from './PrepMode';
import type { Module } from './types';

// Regression for Sentry HEARTH-9 ("null is not an object (evaluating 'e.title')"
// on /module/:id). The tokenless browser client cannot resolve capabilityThread
// docs, so MODULE_DETAIL_QUERY's `capabilityThreads[]->` deref returns null
// elements. PrepMode renders for every module before facilitation, so a null
// element in module.capabilityThreads crashed the whole runner -> "Try again".
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
    // Exactly what the tokenless client returns for a 3-thread module.
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
