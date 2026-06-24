import { useCallback, useEffect, useRef } from 'react';

function getOffsetTopRelativeToScroller(scroller: HTMLElement, active: HTMLElement): number {
  let offsetTop = active.offsetTop;
  let parent = active.offsetParent as HTMLElement | null;

  while (parent && parent !== scroller) {
    offsetTop += parent.offsetTop;
    parent = parent.offsetParent as HTMLElement | null;
  }

  return offsetTop;
}

function centerInScroller(scroller: HTMLElement, active: HTMLElement) {
  const activeOffsetTop = getOffsetTopRelativeToScroller(scroller, active);
  scroller.scrollTop = activeOffsetTop - scroller.clientHeight / 2 + active.clientHeight / 2;
}

function findInspectorElement(scroller: HTMLElement, activeKey: string): HTMLElement | null {
  return Array.from(scroller.querySelectorAll<HTMLElement>('[data-inspector-key]')).find(
    (element) => element.dataset.inspectorKey === activeKey
  ) || null;
}

function findTraceElement(scroller: HTMLElement, activeTraceIndex: number, activeTraceEventId?: string | null): HTMLElement | null {
  if (activeTraceEventId) {
    return Array.from(scroller.querySelectorAll<HTMLElement>('[data-trace-event-id]')).find(
      (element) => element.dataset.traceEventId === activeTraceEventId
    ) || null;
  }
  return scroller.querySelector<HTMLElement>(`[data-trace-index="${activeTraceIndex}"]`);
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function useMethodCockpitSync(
  activeTraceIndex: number,
  activeInspectorKey: string | null,
  traceIdentity: unknown = null,
  activeTraceEventId: string | null = null
) {
  const cockpitRef = useRef<HTMLElement | null>(null);
  const traceScrollerRef = useRef<HTMLDivElement | null>(null);
  const inspectorScrollerRef = useRef<HTMLElement | null>(null);
  const previousTraceScrollRef = useRef<{ index: number; eventId: string | null; identity: unknown } | null>(null);
  const previousInspectorScrollRef = useRef<{ index: number; key: string } | null>(null);

  useEffect(() => {
    if (activeTraceIndex < 0) return;
    const previous = previousTraceScrollRef.current;
    if (previous?.index === activeTraceIndex && previous.eventId === activeTraceEventId && previous.identity === traceIdentity) return;
    const scroller = traceScrollerRef.current;
    const active = scroller ? findTraceElement(scroller, activeTraceIndex, activeTraceEventId) : null;
    if (!scroller || !active) return;
    previousTraceScrollRef.current = { index: activeTraceIndex, eventId: activeTraceEventId, identity: traceIdentity };
    centerInScroller(scroller, active);
  }, [activeTraceEventId, activeTraceIndex, traceIdentity]);

  useEffect(() => {
    if (activeTraceIndex < 0 || !activeInspectorKey) return;
    const previous = previousInspectorScrollRef.current;
    if (previous?.index === activeTraceIndex && previous.key === activeInspectorKey) return;
    const scroller = inspectorScrollerRef.current;
    const active = scroller ? findInspectorElement(scroller, activeInspectorKey) : null;
    if (!scroller || !active) return;
    previousInspectorScrollRef.current = { index: activeTraceIndex, key: activeInspectorKey };
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
