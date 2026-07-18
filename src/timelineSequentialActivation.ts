const TIMELINE_SELECTOR = '[data-home-nostalgia-timeline]';
const ITEM_SELECTOR = '[data-timeline-index]';
const ACTIVE_ITEM_SELECTOR = `${ITEM_SELECTOR}[data-timeline-active="true"]`;
const DEFAULT_STEP_DELAY_MS = 420;
const MANUAL_BYPASS_MS = 1200;
const ACTIVATION_LINE_RATIO = 0.45;
const SYNTHETIC_SCROLL_GUARD_MS = 80;

function readTimelineIndex(element: Element | null): number | null {
  if (!(element instanceof HTMLElement)) return null;
  const index = Number(element.dataset.timelineIndex);
  return Number.isInteger(index) ? index : null;
}

function getActiveIndex(timeline: HTMLElement): number | null {
  return readTimelineIndex(timeline.querySelector(ACTIVE_ITEM_SELECTOR));
}

function getViewportTargetIndex(timeline: HTMLElement): number | null {
  const timelineRect = timeline.getBoundingClientRect();
  if (timelineRect.bottom < 0 || timelineRect.top > window.innerHeight) return null;

  const activationLine = window.innerHeight * ACTIVATION_LINE_RATIO;
  let closestIndex: number | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  timeline.querySelectorAll<HTMLElement>(ITEM_SELECTOR).forEach(item => {
    const index = readTimelineIndex(item);
    if (index === null) return;
    const anchor = item.querySelector<HTMLElement>('button[type="button"]') ?? item;
    const rect = anchor.getBoundingClientRect();
    const anchorPosition = rect.top + Math.min(rect.height, 56) / 2;
    const distance = Math.abs(anchorPosition - activationLine);
    if (distance >= closestDistance) return;
    closestDistance = distance;
    closestIndex = index;
  });

  return closestIndex;
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
  let scrollFrame: number | null = null;
  let manualBypassUntil = 0;
  let syntheticLockUntil = 0;
  let lastSyntheticStepAt = 0;

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
    lastSyntheticStepAt = performance.now();
    syntheticLockUntil = lastSyntheticStepAt + MANUAL_BYPASS_MS;

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

  const updateTargetFromViewport = () => {
    scrollFrame = null;
    const now = performance.now();
    if (now < manualBypassUntil || now - lastSyntheticStepAt < SYNTHETIC_SCROLL_GUARD_MS) return;
    if (now >= syntheticLockUntil && targetIndex === null && expectedIndex === null) return;

    const viewportTarget = getViewportTargetIndex(timeline);
    if (viewportTarget === null || stableIndex === null) return;
    targetIndex = viewportTarget;

    if (
      expectedIndex === null
      && stepTimer === null
      && fallbackTimer === null
      && targetIndex !== stableIndex
    ) {
      advanceSequence();
    }
  };

  const handleScroll = () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateTargetFromViewport);
  };

  timeline.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(ITEM_SELECTOR);
    if (!item || !timeline.contains(item)) return;

    manualBypassUntil = performance.now() + MANUAL_BYPASS_MS;
    syntheticLockUntil = 0;
    stableIndex = readTimelineIndex(item);
    resetSequence();
  }, true);

  window.addEventListener('scroll', handleScroll, { passive: true });

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
