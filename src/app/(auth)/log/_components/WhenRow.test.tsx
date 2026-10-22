/**
 * WhenRow — Today · Yesterday · Another day, derived from the stored date.
 * Pins the end of the hidden "earlier = −5 days" offset: every emitted value is
 * explicit (null for today, a real ISO day otherwise).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WhenRow } from './WhenRow';
import { noticeCopy } from './noticeCopy';

const NOW = new Date(2026, 9, 7, 10, 30); // Wed 7 Oct 2026, local

afterEach(cleanup);

const segment = (label: string) => screen.getByRole('button', { name: label });

describe('WhenRow', () => {
  it('lights Today for a null date and Yesterday / Another day for stored dates', () => {
    const { rerender } = render(<WhenRow dateOccurred={null} onChange={vi.fn()} now={NOW} />);
    expect(segment(noticeCopy.today)).toHaveAttribute('aria-pressed', 'true');
    expect(segment(noticeCopy.yesterday)).toHaveAttribute('aria-pressed', 'false');
    expect(segment(noticeCopy.anotherDay)).toHaveAttribute('aria-pressed', 'false');

    rerender(<WhenRow dateOccurred="2026-10-06" onChange={vi.fn()} now={NOW} />);
    expect(segment(noticeCopy.yesterday)).toHaveAttribute('aria-pressed', 'true');

    rerender(<WhenRow dateOccurred="2026-10-01" onChange={vi.fn()} now={NOW} />);
    expect(segment(noticeCopy.anotherDay)).toHaveAttribute('aria-pressed', 'true');
  });

  it('emits yesterday’s ISO day for the fixed now', () => {
    const onChange = vi.fn();
    render(<WhenRow dateOccurred={null} onChange={onChange} now={NOW} />);
    fireEvent.click(segment(noticeCopy.yesterday));
    expect(onChange).toHaveBeenCalledWith('2026-10-06');
  });

  it('emits null for Today', () => {
    const onChange = vi.fn();
    render(<WhenRow dateOccurred="2026-10-01" onChange={onChange} now={NOW} />);
    fireEvent.click(segment(noticeCopy.today));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('reveals the date input (capped at today) for Another day, and emits the picked date', () => {
    const onChange = vi.fn();
    render(<WhenRow dateOccurred={null} onChange={onChange} now={NOW} />);
    expect(screen.queryByLabelText(noticeCopy.pickDate)).not.toBeInTheDocument();

    fireEvent.click(segment(noticeCopy.anotherDay));
    // Opening the picker changes nothing yet — the stored date is still today.
    expect(onChange).not.toHaveBeenCalled();
    expect(segment(noticeCopy.anotherDay)).toHaveAttribute('aria-pressed', 'true');
    expect(segment(noticeCopy.today)).toHaveAttribute('aria-pressed', 'false');

    const input = screen.getByLabelText(noticeCopy.pickDate);
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveAttribute('max', '2026-10-07');
    expect(input).toHaveValue('2026-10-07');

    fireEvent.change(input, { target: { value: '2026-09-28' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-09-28');
  });

  it('closes the picker again when Today is tapped', () => {
    const onChange = vi.fn();
    render(<WhenRow dateOccurred={null} onChange={onChange} now={NOW} />);
    fireEvent.click(segment(noticeCopy.anotherDay));
    expect(screen.getByLabelText(noticeCopy.pickDate)).toBeInTheDocument();
    fireEvent.click(segment(noticeCopy.today));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByLabelText(noticeCopy.pickDate)).not.toBeInTheDocument();
  });
});
