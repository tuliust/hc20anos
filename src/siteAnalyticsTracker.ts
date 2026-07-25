import { writeAudit } from "./lib/services";

const VISITOR_KEY = "hc-site-visitor-id";
const SESSION_KEY = "hc-site-session-id";
const PUBLIC_VIEW_ACTION = "site_page_view";
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

let installed = false;
let lastRecordedUrl = "";

function createId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function storedId(storage: Storage, key: string, prefix: string) {
  try {
    const current = storage.getItem(key);
    if (current) return current;
    const created = createId(prefix);
    storage.setItem(key, created);
    return created;
  } catch {
    return createId(prefix);
  }
}

function isPublicRoute(pathname: string) {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/checkin");
}

function recordPageView() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (!isPublicRoute(pathname)) return;

  const currentUrl = `${pathname}${window.location.search}`;
  if (currentUrl === lastRecordedUrl) return;
  lastRecordedUrl = currentUrl;

  const visitorId = storedId(window.localStorage, VISITOR_KEY, "visitor");
  const sessionId = storedId(window.sessionStorage, SESSION_KEY, "session");
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  void writeAudit(PUBLIC_VIEW_ACTION, "site", null, {
    event_id: DEFAULT_EVENT_ID,
    visitor_id: visitorId,
    session_id: sessionId,
    path: pathname,
    query: window.location.search || null,
    is_mobile: isMobile,
    referrer: document.referrer || null,
  });
}

export function installSiteAnalyticsTracker() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const start = () => {
    recordPageView();
    window.addEventListener("popstate", recordPageView);
    window.addEventListener("pushstate", recordPageView);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
