function getOpenProfileMenu() {
  const trigger = document.querySelector<HTMLButtonElement>(
    '.public-header-desktop-action button[aria-label="Abrir menu da conta"]',
  );
  const wrapper = trigger?.closest<HTMLElement>(".public-header-desktop-action") ?? null;
  const menu = wrapper?.querySelector<HTMLElement>("div.absolute.right-0.top-full") ?? null;

  return { trigger, wrapper, menu };
}

function handleOutsideProfileMenuPointerDown(event: PointerEvent) {
  const { trigger, wrapper, menu } = getOpenProfileMenu();
  if (!trigger || !wrapper || !menu) return;

  const eventPath = event.composedPath();
  if (eventPath.includes(wrapper)) return;

  trigger.click();
}

export function installHeaderMenuEnhancements() {
  if (typeof document === "undefined") return;

  document.addEventListener("pointerdown", handleOutsideProfileMenuPointerDown, true);
}
