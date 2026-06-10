import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewedOnce } from './use-viewed-once';

// ─── IntersectionObserver mock ────────────────────────────────────────────────

type IOCallback = IntersectionObserverCallback;
let lastIOCallback: IOCallback | null = null;
let observeSpy: ReturnType<typeof vi.fn>;
let disconnectSpy: ReturnType<typeof vi.fn>;

function triggerIntersection(isIntersecting: boolean) {
  lastIOCallback?.(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRef() {
  return { current: document.createElement('div') };
}

function setTabVisible(visible: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (visible ? 'visible' : 'hidden'),
  });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('useViewedOnce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setTabVisible(true);

    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    lastIOCallback = null;

    // Use a class so `new IntersectionObserver(cb)` is valid. Arrow functions
    // are not constructable, so mockImplementation(arrow) would throw.
    const obs = observeSpy;
    const dis = disconnectSpy;
    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        constructor(cb: IOCallback) { lastIOCallback = cb; }
        observe = obs;
        disconnect = dis;
        unobserve = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setTabVisible(true);
  });

  it('fires callback after full dwell time when intersecting and tab visible', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    expect(callback).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not fire before dwell time elapses', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(999); });
    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels timer when element leaves the viewport', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(500); });
    act(() => { triggerIntersection(false); }); // leaves before dwell completes
    act(() => { vi.advanceTimersByTime(1000); }); // would have fired if timer survived
    expect(callback).not.toHaveBeenCalled();
  });

  it('fires only once even when element re-enters after firing', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(callback).toHaveBeenCalledOnce();

    // Re-enter and wait again — must not fire a second time
    act(() => { triggerIntersection(false); });
    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not start the timer when the tab is hidden at intersection time', () => {
    const callback = vi.fn();
    const ref = makeRef();
    setTabVisible(false);

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels an in-progress timer when the tab is hidden', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(500); });

    setTabVisible(false);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(callback).not.toHaveBeenCalled();
  });

  it('restarts the timer when the tab becomes visible again with element still intersecting', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(500); });

    // Tab goes hidden — timer cancelled
    setTabVisible(false);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(600); }); // extra time passes while hidden

    // Tab comes back — full dwell starts over
    setTabVisible(true);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(999); });
    expect(callback).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1); });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('is dormant when enabled is false', () => {
    const callback = vi.fn();
    const ref = makeRef();

    renderHook(() => useViewedOnce(ref, callback, { enabled: false, dwellMs: 1000 }));

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(callback).not.toHaveBeenCalled();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('begins observing when enabled transitions from false to true', () => {
    const callback = vi.fn();
    const ref = makeRef();

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useViewedOnce(ref, callback, { enabled, dwellMs: 1000 }),
      { initialProps: { enabled: false } },
    );

    expect(observeSpy).not.toHaveBeenCalled();

    act(() => { rerender({ enabled: true }); });
    expect(observeSpy).toHaveBeenCalledOnce();

    act(() => { triggerIntersection(true); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(callback).toHaveBeenCalledOnce();
  });
});
