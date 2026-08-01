'use client';

import { useRef, type RefObject, type TouchEvent } from 'react';

const DISMISS_THRESHOLD_PX = 80;
const EXIT_MS = 300; // matches --motion-base, which the exit transition uses

/**
 * Swipe-to-dismiss for bottom sheets. Attach the returned props to the
 * sheet's drag handle (not the whole sheet — scrollable sheet bodies would
 * fight the gesture). The sheet follows the finger; past the threshold it
 * slides out and `onDismiss` fires, otherwise it springs back.
 */
export function useSheetDrag(
  sheetRef: RefObject<HTMLDivElement | null>,
  onDismiss: () => void,
) {
  const startY = useRef<number | null>(null);
  const delta = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    delta.current = 0;
    const el = sheetRef.current;
    if (el) el.style.transition = 'none';
  };

  const onTouchMove = (e: TouchEvent) => {
    if (startY.current === null) return;
    delta.current = Math.max(0, e.touches[0].clientY - startY.current);
    const el = sheetRef.current;
    if (el) el.style.transform = `translateY(${delta.current}px)`;
  };

  const onTouchEnd = () => {
    const el = sheetRef.current;
    startY.current = null;
    if (!el) return;
    el.style.transition = 'transform var(--motion-base) var(--ease-out)';
    if (delta.current > DISMISS_THRESHOLD_PX) {
      el.style.transform = 'translateY(100%)';
      window.setTimeout(() => {
        // Clear inline styles so the sheet's own open/close classes take
        // over again the next time it opens.
        el.style.transform = '';
        el.style.transition = '';
        onDismiss();
      }, EXIT_MS);
    } else {
      el.style.transform = '';
      window.setTimeout(() => {
        el.style.transition = '';
      }, EXIT_MS);
    }
  };

  // touchAction: 'none' stops the browser claiming the vertical pan for
  // page scroll while the finger is on the handle.
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    style: { touchAction: 'none' } as const,
  };
}
