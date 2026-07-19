const MOBILE_QUERY = "(max-width: 767px)";
const AVATAR_ATTRIBUTE = "data-mobile-confirmed-avatar";

let scheduled = false;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function findConfirmedCard(): HTMLElement | null {
  const section = document.querySelector<HTMLElement>('[data-home-alumni-overview]');
  if (!section) return null;

  const title = Array.from(section.querySelectorAll<HTMLElement>("p,h2,h3"))
    .find(element => normalize(element.textContent) === "quem confirmou presença");
  if (!title) return null;

  let current: HTMLElement | null = title.parentElement;
  while (current && current !== section) {
    if (current.querySelector("img") || current.querySelector('[role="img"]')) return current;
    current = current.parentElement;
  }

  return null;
}

function resetAvatar(element: HTMLElement) {
  if (!element.hasAttribute(AVATAR_ATTRIBUTE)) return;
  element.removeAttribute(AVATAR_ATTRIBUTE);
  [
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "aspect-ratio",
    "border-radius",
    "object-fit",
  ].forEach(property => element.style.removeProperty(property));
}

function applyCircularAvatar() {
  const card = findConfirmedCard();
  if (!card) return;

  const avatars = Array.from(card.querySelectorAll<HTMLElement>('img, [role="img"]'));
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;

  avatars.forEach(avatar => {
    if (!isMobile) {
      resetAvatar(avatar);
      return;
    }

    avatar.setAttribute(AVATAR_ATTRIBUTE, "true");
    const size = "clamp(8.75rem, 40vw, 10.5rem)";
    avatar.style.setProperty("width", size, "important");
    avatar.style.setProperty("height", size, "important");
    avatar.style.setProperty("min-width", size, "important");
    avatar.style.setProperty("min-height", size, "important");
    avatar.style.setProperty("max-width", size, "important");
    avatar.style.setProperty("max-height", size, "important");
    avatar.style.setProperty("aspect-ratio", "1 / 1", "important");
    avatar.style.setProperty("border-radius", "50%", "important");
    avatar.style.setProperty("object-fit", "cover", "important");
  });
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyCircularAvatar();
  });
}

export function installHomeMobileDomRefinements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcHomeMobileDomRefinementsInstalled) return;
  (window as any).__hcHomeMobileDomRefinementsInstalled = true;

  const start = () => {
    scheduleApply();
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.matchMedia(MOBILE_QUERY).addEventListener("change", scheduleApply);
    window.addEventListener("resize", scheduleApply);
    window.addEventListener("popstate", scheduleApply);
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}