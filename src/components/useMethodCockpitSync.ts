import { useCallback, useEffect, useRef } from 'react';

function centerInScroller(scroller: HTMLElement, active: HTMLElement) {
  scroller.scrollTop = active.offsetTop - scroller.clientHeight / 2 + active.clientHeight / 2;
}

function findInspectorElement(scroller: HTMLElement, activeKey: string): HTMLElement | null {
  return Array.from(scroller.querySelectorAll<HTMLElement>('[data-inspector-key]')).find(
    (element) => element.dataset.inspectorKey === activeKey
  ) || null;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function useMethodCockpitSync(activeTraceIndex: number, activeInspectorKey: string | null) {
  const cockpitRef = useRef<HTMLElement | null>(null);
  const traceScrollerRef = useRef<HTMLDivElement | null>(null);
  const inspectorScrollerRef = useRef<HTMLElement | null>(null);
  const previousTraceIndexRef = useRef<number>(-1);
  const previousInspectorStepRef = useRef<number>(-1);

  useEffect(() => {
    if (activeTraceIndex < 0 || previousTraceIndexRef.current === activeTraceIndex) return;
    previousTraceIndexRef.current = activeTraceIndex;
    const scroller = traceScrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>(`[data-trace-index="${activeTraceIndex}"]`);
    if (!scroller || !active) return;
    centerInScroller(scroller, active);
  }, [activeTraceIndex]);

  useEffect(() => {
    if (activeTraceIndex < 0 || !activeInspectorKey || previousInspectorStepRef.current === activeTraceIndex) return;
    previousInspectorStepRef.current = activeTraceIndex;
    const scroller = inspectorScrollerRef.current;
    const active = scroller ? findInspectorElement(scroller, activeInspectorKey) : null;
    if (!scroller || !active) return;
    centerInScroller(scroller, active);
  }, [activeTraceIndex, activeInspectorKey]);

  const scrollCockpitIntoViewForPlay = useCallback(() => {
    const cockpit = cockpitRef.current;
    if (!cockpit || typeof window === 'undefined') return;
    const rect = cockpit.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const requiredVisible = Math.min(rect.height * 0.72, viewportHeight * 0.68);
    if (visibleHeight >= requiredVisible) return;

    const centeredTop = window.scrollY + rect.top - Math.max(16, (viewportHeight - rect.height) / 2);
    window.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  const setInspectorScrollerRef = useCallback((node: HTMLElement | null) => {
    inspectorScrollerRef.current = node;
  }, []);

  return {
    cockpitRef,
    traceScrollerRef,
    setInspectorScrollerRef,
    scrollCockpitIntoViewForPlay,
  };
}
