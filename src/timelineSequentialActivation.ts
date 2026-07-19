const TIMELINE_SELECTOR = '[data-home-nostalgia-timeline]';
const ITEM_SELECTOR = '[data-timeline-index]';
const ACTIVE_ITEM_SELECTOR = `${ITEM_SELECTOR}[data-timeline-active="true"]`;
const MANUAL_BYPASS_MS = 900;
const LAYOUT_SETTLE_MS = 360;
const SWITCH_HYSTERESIS_PX = 24;
const SPACING_STYLE_ID = 'hc-timeline-marker-spacing';

function installTimelineSpacingStyles() {
  if (document.getElementById(SPACING_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SPACING_STYLE_ID;
  style.textContent = `
${TIMELINE_SELECTOR}[data-sequential-activation="true"] ${ITEM_SELECTOR} {
  min-height: clamp(6.5rem, 18vh, 11rem);
  transition: opacity 280ms ease, transform 360ms cubic-bezier(.2,.75,.25,1);
  transform-origin: left center;
}

${TIMELINE_SELECTOR}[data-sequential-activation="true"] ${ITEM_SELECTOR}:not([data-timeline-active="true"]) {
  opacity: .68;
  transform: translateY(2px);
}

${TIMELINE_SELECTOR}[data-sequential-activation="true"] ${ITEM_SELECTOR}[data-timeline-active="true"] {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 767px) {
  ${TIMELINE_SELECTOR}[data-sequential-activation="true"] ${ITEM_SELECTOR} {
    min-height: clamp(5.75rem, 14vh, 8.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  ${TIMELINE_SELECTOR}[data-sequential-activation="true"] ${ITEM_SELECTOR} {
    transition: none;
    transform: none;
  }
}
`;
  document.head.appendChild(style);
}

function readTimelineIndex(element: Element | null): number | null {
  if (!(element instanceof HTMLElement)) return null;
  const index = Number(element.dataset.timelineIndex);
  return Number.isInteger(index) ? index : null;
}

function getActiveIndex(timeline: HTMLElement): number | null {
  return readTimelineIndex(timeline.querySelector(ACTIVE_ITEM_SELECTOR));
}

function getTimelineItems(timeline: HTMLElement) {
  return Array.from(timeline.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
    .map(item => ({ item, index: readTimelineIndex(item) }))
    .filter((entry): entry is { item: HTMLElement; index: number } => entry.index !== null)
    .sort((a, b) => a.index - b.index);
}

function getItemAnchor(item: HTMLElement) {
  return item.querySelector<HTMLElement>('button[type="button"]') ?? item;
}

function getActivationLine() {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return window.innerHeight * (mobile ? 0.57 : 0.52);
}

function getViewportCandidate(timeline: HTMLElement, activeIndex: number | null) {
  const timelineRect = timeline.getBoundingClientRect();
  if (timelineRect.bottom < 0 || timelineRect.top > window.innerHeight) return null;

  const activationLine = getActivationLine();
  const candidates = getTimelineItems(timeline).map(({ item, index }) => {
    const rect = getItemAnchor(item).getBoundingClientRect();
    const anchorPosition = rect.top + Math.min(rect.height, 64) / 2;
    return {
      index,
      distance: Math.abs(anchorPosition - activationLine),
    };
  });

  const closest = candidates.reduce<(typeof candidates)[number] | null>((best, candidate) => {
    if (!best || candidate.distance < best.distance) return candidate;
    return best;
  }, null);

  if (!closest) return null;
  if (activeIndex === null || closest.index === activeIndex) return closest.index;

  const active = candidates.find(candidate => candidate.index === activeIndex);
  if (active && closest.distance + SWITCH_HYSTERESIS_PX >= active.distance) return activeIndex;

  return closest.index;
}

function clickTimelineItem(timeline: HTMLElement, index: number) {
  const entry = getTimelineItems(timeline).find(candidate => candidate.index === index);
  const button = entry?.item.querySelector<HTMLButtonElement>('button[type="button"]');
  if (!button) return false;
  button.click();
  return true;
}

function enhanceTimeline(timeline: HTMLElement) {
  if (timeline.dataset.sequentialActivation === 'true') return;
  timeline.dataset.sequentialActivation = 'true';

  let activeIndex = getActiveIndex(timeline);
  let manualBypassUntil = 0;
  let layoutLockUntil = 0;
  let scrollFrame: number | null = null;
  let settleTimer: number | null = null;

  const requestEvaluation = () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;

      const now = performance.now();
      if (now < manualBypassUntil || now < layoutLockUntil) return;

      const currentActive = getActiveIndex(timeline);
      if (currentActive !== null) activeIndex = currentActive;

      const candidate = getViewportCandidate(timeline, activeIndex);
      if (candidate === null || candidate === activeIndex) return;

      if (!clickTimelineItem(timeline, candidate)) return;
      activeIndex = candidate;
      layoutLockUntil = performance.now() + LAYOUT_SETTLE_MS;

      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        settleTimer = null;
        layoutLockUntil = 0;
        requestEvaluation();
      }, LAYOUT_SETTLE_MS + 30);
    });
  };

  timeline.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const item = target.closest<HTMLElement>(ITEM_SELECTOR);
    if (!item || !timeline.contains(item)) return;

    manualBypassUntil = performance.now() + MANUAL_BYPASS_MS;
    layoutLockUntil = manualBypassUntil;
    activeIndex = readTimelineIndex(item);
  }, true);

  window.addEventListener('scroll', requestEvaluation, { passive: true });
  window.addEventListener('resize', requestEvaluation, { passive: true });

  const observer = new MutationObserver(() => {
    const nextActiveIndex = getActiveIndex(timeline);
    if (nextActiveIndex !== null) activeIndex = nextActiveIndex;
  });

  observer.observe(timeline, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-timeline-active'],
  });

  requestEvaluation();
}

function scanForTimelines() {
  document.querySelectorAll<HTMLElement>(TIMELINE_SELECTOR).forEach(enhanceTimeline);
}

export function installTimelineSequentialActivation() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

  installTimelineSpacingStyles();

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
