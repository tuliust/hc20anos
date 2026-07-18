const TIMELINE_SELECTOR = '[data-home-nostalgia-timeline]';
const ITEM_SELECTOR = '[data-timeline-index]';
const ACTIVE_ITEM_SELECTOR = `${ITEM_SELECTOR}[data-timeline-active="true"]`;
const DEFAULT_STEP_DELAY_MS = 420;
const MANUAL_BYPASS_MS = 1200;

function readTimelineIndex(element: Element | null): number | null {
  if (!(element instanceof HTMLElement)) return null;
  const index = Number(element.dataset.timelineIndex);
  return Number.isInteger(index) ? index : null;
}

function getActiveIndex(timeline: HTMLElement): number | null {
  return readTimelineIndex(timeline.querySelector(ACTIVE_ITEM_SELECTOR));
}

function clickTimelineItem(timeline: HTMLElement, index: number): boolean {
  const item = Array.from(timeline.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
    .find(element => readTimelineIndex(element) === index);
  const button = item?.querySelector<HTMLButtonElement>('button[type="button"]');
  if (!button) return false;
  button.click();
  return true;
}

function enhanceTimeline(timeline: HTMLElement) {
  if (timeline.dataset.sequentialActivation === 'true') return;
  timeline.dataset.sequentialActivation = 'true';

  const stepDelayMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : DEFAULT_STEP_DELAY_MS;

  let stableIndex = getActiveIndex(timeline);
  let targetIndex: number | null = null;
  let expectedIndex: number | null = null;
  let stepTimer: number | null = null;
  let fallbackTimer: number | null = null;
  let manualBypassUntil = 0;

  const clearTimers = () => {
    if (stepTimer !== null) window.clearTimeout(stepTimer);
    if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    stepTimer = null;
    fallbackTimer = null;
  };

  const resetSequence = () => {
    clearTimers();
    targetIndex = null;
    expectedIndex = null;
  };

  const advanceSequence = () => {
    clearTimers();
    if (targetIndex === null || stableIndex === null || targetIndex === stableIndex) {
      resetSequence();
      return;
    }

    const nextIndex = stableIndex + Math.sign(targetIndex - stableIndex);
    expectedIndex = nextIndex;

    if (!clickTimelineItem(timeline, nextIndex)) {
      resetSequence();
      return;
    }

    fallbackTimer = window.setTimeout(() => {
      if (expectedIndex !== nextIndex) return;
      const activeIndex = getActiveIndex(timeline);
      if (activeIndex === nextIndex) stableIndex = nextIndex;
      expectedIndex = null;
      advanceSequence();
    }, Math.max(stepDelayMs + 180, 180));
  };

  const scheduleNextStep = () => {
    clearTimers();
    stepTimer = window.setTimeout(advanceSequence, stepDelayMs);
  };

  timeline.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(ITEM_SELECTOR);
    if (!item || !timeline.contains(item)) return;

    manualBypassUntil = performance.now() + MANUAL_BYPASS_MS;
    stableIndex = readTimelineIndex(item);
    resetSequence();
  }, true);

  const observer = new MutationObserver(() => {
    const activeIndex = getActiveIndex(timeline);
    if (activeIndex === null) return;

    if (performance.now() < manualBypassUntil) {
      stableIndex = activeIndex;
      resetSequence();
      return;
    }

    if (expectedIndex !== null) {
      if (activeIndex !== expectedIndex) return;
      stableIndex = activeIndex;
      expectedIndex = null;
      scheduleNextStep();
      return;
    }

    if (stableIndex === null) {
      stableIndex = activeIndex;
      return;
    }

    const distance = activeIndex - stableIndex;
    if (Math.abs(distance) <= 1) {
      stableIndex = activeIndex;
      resetSequence();
      return;
    }

    targetIndex = activeIndex;
    advanceSequence();
  });

  observer.observe(timeline, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-timeline-active'],
  });
}

function scanForTimelines() {
  document.querySelectorAll<HTMLElement>(TIMELINE_SELECTOR).forEach(enhanceTimeline);
}

export function installTimelineSequentialActivation() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

  const start = () => {
    scanForTimelines();
    const observer = new MutationObserver(scanForTimelines);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
