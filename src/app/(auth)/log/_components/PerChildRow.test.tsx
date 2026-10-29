/**
 * PerChildRow — felt chips as a radiogroup + the "said / asked / noticed" line.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PerChildRow } from './PerChildRow';
import { noticeCopy } from './noticeCopy';
import { FELT_LEVELS } from '@/lib/logger/notice';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

const emma: LearnerRecord = {
  id: 'l1',
  name: 'Emma',
  dateOfBirth: null,
  shapeIcon: '●',
  colourToken: 'blue',
};

afterEach(cleanup);

describe('PerChildRow', () => {
  it('renders the four felt levels as a radiogroup with aria-checked on the lit one', () => {
    render(<PerChildRow learner={emma} felt={3} noticed="" onFelt={vi.fn()} onNoticed={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: noticeCopy.felt('Emma') });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(FELT_LEVELS.length);
    expect(within(group).getByRole('radio', { name: 'Into it' })).toHaveAttribute('aria-checked', 'true');
    expect(within(group).getByRole('radio', { name: 'Loved it' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onFelt with the tapped level, including the already-lit one (reducer clears)', () => {
    const onFelt = vi.fn();
    render(<PerChildRow learner={emma} felt={4} noticed="" onFelt={onFelt} onNoticed={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Hard going' }));
    expect(onFelt).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('radio', { name: 'Loved it' }));
    expect(onFelt).toHaveBeenLastCalledWith(4);
  });

  it('exposes the noticed input by its label and reports typing via onNoticed', () => {
    const onNoticed = vi.fn();
    render(<PerChildRow learner={emma} felt={undefined} noticed="" onFelt={vi.fn()} onNoticed={onNoticed} />);
    const input = screen.getByLabelText(noticeCopy.noticedLabel('Emma'));
    expect(input).toHaveAttribute('placeholder', noticeCopy.noticedPlaceholder('Emma'));
    fireEvent.change(input, { target: { value: 'Why is the sky blue?' } });
    expect(onNoticed).toHaveBeenCalledWith('Why is the sky blue?');
  });
});
