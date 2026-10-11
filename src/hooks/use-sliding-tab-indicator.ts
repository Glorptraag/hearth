'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Sliding active-tab indicator — the one "tracking" motion the motion spec
 * permits (§ Tab switching). The indicator is a 1px-wide bar that is
 * translated under the active tab and scaled to its width, so only
 * `transform` ever animates; width and left never do.
 *
 * Usage:
 *   const { listRef, indicatorProps } = useSlidingTabIndicator(activeKey);
 *   <div ref={listRef} className="relative flex …">
 *     {tabs.map(t => <button data-tab-key={t.key} …/>)}
 *     <span {...indicatorProps} />
 *   </div>
 *
 * The list must be positioned (`relative`) so offsetLeft is measured against
 * it. Tabs are located by `data-tab-key`, so they can be any element and can
 * live inside a horizontally scrolling bar. Widths are re-measured when the
 * bar or any tab resizes (fonts settling, counts arriving).
 */
export function useSlidingTabIndicator<T extends HTMLElement = HTMLDivElement>(activeKey: string): {
  listRef: RefObject<T | null>;
  indicatorProps: {
    className: string;
    style: CSSProperties | undefined;
    'data-ready': 'true' | 'false';
    'aria-hidden': true;
  };
} {
  const listRef = useRef<T>(null);
  const [metrics, setMetrics] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selector = `[data-tab-key="${activeKey.replace(/"/g, '\\"')}"]`;

    // Measure-then-set inside useLayoutEffect is deliberate: the indicator must
    // land before paint, and the state only changes when the active tab moves.
    const measure = () => {
      const el = list.querySelector<HTMLElement>(selector);
      if (!el) {
        setMetrics(null);
        return;
      }
      setMetrics({ x: el.offsetLeft, w: el.offsetWidth });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    list.querySelectorAll<HTMLElement>('[data-tab-key]').forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [activeKey]);

  return {
    listRef,
    indicatorProps: {
      className: 'hearth-tab-indicator',
      style: metrics ? { transform: `translateX(${metrics.x}px) scaleX(${metrics.w})` } : undefined,
      'data-ready': metrics ? 'true' : 'false',
      'aria-hidden': true,
    },
  };
}
