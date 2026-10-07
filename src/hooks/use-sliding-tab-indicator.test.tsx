import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useSlidingTabIndicator } from './use-sliding-tab-indicator';

function Tabs({ initial = 'a' }: { initial?: string }) {
  const [active, setActive] = useState(initial);
  const { listRef, indicatorProps } = useSlidingTabIndicator(active);
  return (
    <div ref={listRef} className="relative flex">
      {['a', 'b'].map((k) => (
        <button key={k} data-tab-key={k} onClick={() => setActive(k)}>
          {k}
        </button>
      ))}
      <span data-testid="indicator" {...indicatorProps} />
    </div>
  );
}

describe('useSlidingTabIndicator', () => {
  it('measures the active tab on mount and exposes a transform-only style', () => {
    render(<Tabs />);
    const bar = screen.getByTestId('indicator');
    expect(bar).toHaveClass('hearth-tab-indicator');
    expect(bar).toHaveAttribute('data-ready', 'true');
    expect(bar).toHaveAttribute('aria-hidden', 'true');
    // jsdom has no layout, so offsets are 0 — the shape of the style is what matters.
    expect(bar.getAttribute('style')).toMatch(/transform: translateX\(0px\) scaleX\(0\)/);
    expect(bar.getAttribute('style')).not.toMatch(/width|left/);
  });

  it('stays hidden until the active tab can be found', () => {
    render(<Tabs initial="missing" />);
    const bar = screen.getByTestId('indicator');
    expect(bar).toHaveAttribute('data-ready', 'false');
    expect(bar.getAttribute('style')).toBeNull();
  });
});
