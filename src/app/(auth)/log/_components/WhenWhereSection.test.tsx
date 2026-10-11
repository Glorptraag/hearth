/**
 * WhenWhereSection — the "Earlier" chip must expose the real date it will
 * save. Before this, "Earlier" silently stamped every such entry as exactly
 * five days ago, which a parent could neither see nor change.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { format, subDays } from 'date-fns';
import { WhenWhereSection, defaultEarlierDate, EARLIER_MAX_DAYS_BACK } from './WhenWhereSection';

vi.mock('./SectionHeader', () => ({
  SectionHeader: ({ label }: { label: string }) => <h2>{label}</h2>,
}));

afterEach(cleanup);

function renderSection(props: Partial<Parameters<typeof WhenWhereSection>[0]> = {}) {
  const onWhenDateChange = vi.fn();
  const onEarlierDateChange = vi.fn();
  render(
    <WhenWhereSection
      done={false}
      whenDate="today"
      onWhenDateChange={onWhenDateChange}
      onEarlierDateChange={onEarlierDateChange}
      duration={null}
      onDurationChange={vi.fn()}
      location={null}
      onLocationChange={vi.fn()}
      {...props}
    />,
  );
  return { onWhenDateChange, onEarlierDateChange };
}

describe('WhenWhereSection — Earlier date picker', () => {
  it('shows no picker for today / yesterday', () => {
    renderSection({ whenDate: 'yesterday' });
    expect(screen.queryByLabelText(/date it happened/i)).toBeNull();
  });

  it('seeds a visible default date the first time Earlier is chosen', () => {
    const { onWhenDateChange, onEarlierDateChange } = renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Earlier' }));
    expect(onWhenDateChange).toHaveBeenCalledWith('earlier');
    expect(onEarlierDateChange).toHaveBeenCalledWith(defaultEarlierDate());
  });

  it('does not overwrite a date the parent already picked', () => {
    const { onEarlierDateChange } = renderSection({ whenDate: 'earlier', earlierDate: '2026-09-28' });
    fireEvent.click(screen.getByRole('button', { name: 'Earlier' }));
    expect(onEarlierDateChange).not.toHaveBeenCalled();
  });

  it('renders a bounded date input and reports changes', () => {
    const { onEarlierDateChange } = renderSection({ whenDate: 'earlier', earlierDate: '2026-09-28' });
    const input = screen.getByLabelText(/date it happened/i) as HTMLInputElement;
    expect(input.type).toBe('date');
    expect(input.value).toBe('2026-09-28');
    expect(input.max).toBe(format(new Date(), 'yyyy-MM-dd'));
    expect(input.min).toBe(format(subDays(new Date(), EARLIER_MAX_DAYS_BACK), 'yyyy-MM-dd'));
    fireEvent.change(input, { target: { value: '2026-09-20' } });
    expect(onEarlierDateChange).toHaveBeenCalledWith('2026-09-20');
  });

  it('defaults to the day before yesterday (today and yesterday have chips)', () => {
    const now = new Date('2026-10-06T10:00:00');
    expect(defaultEarlierDate(now)).toBe('2026-10-04');
  });
});
