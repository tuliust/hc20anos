let installed = false;

const LOCATION_CHANGE_EVENT = "pushstate";

function dispatchLocationChange() {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

export function installAdminTicketLotsRouteSync() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = ((...args: Parameters<History["pushState"]>) => {
    originalPushState(...args);
    dispatchLocationChange();
  }) as History["pushState"];

  window.history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    originalReplaceState(...args);
    dispatchLocationChange();
  }) as History["replaceState"];

  let lastHref = window.location.href;
  window.setInterval(() => {
    if (window.location.href === lastHref) return;
    lastHref = window.location.href;
    dispatchLocationChange();
  }, 250);
}
