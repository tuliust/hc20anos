import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const LOCAL_ACTION_GRACE_MS = 8_000;
const REMOTE_REFRESH_DELAY_MS = 450;
const REVISION_INTERVAL_MS = 10_000;

let installed = false;
let ignoreRealtimeUntil = 0;
let refreshTimer: number | null = null;
let revisionCheckInFlight = false;
let revisionInitialized = false;
let lastRevision = "";
let activeRouteKey = "";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isPublicMemoriesRoute() {
  return currentPath() === "/nossa-historia/memorias";
}

function isAdminMemoriesRoute() {
  if (!currentPath().startsWith("/admin")) return false;
  return new URLSearchParams(window.location.search).get("tab") === "memories";
}

function isRelevantRoute() {
  return isPublicMemoriesRoute() || isAdminMemoriesRoute();
}

function getRouteKey() {
  return `${currentPath()}${window.location.search}`;
}

function scheduleRemoteRefresh() {
  if (!isRelevantRoute() || Date.now() < ignoreRealtimeUntil) return;
  if (document.visibilityState === "hidden") return;

  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    if (isRelevantRoute()) window.location.reload();
  }, REMOTE_REFRESH_DELAY_MS);
}

async function checkMemoryRevision() {
  if (!isRelevantRoute() || revisionCheckInFlight) return;

  const routeKey = getRouteKey();
  if (routeKey !== activeRouteKey) {
    activeRouteKey = routeKey;
    revisionInitialized = false;
    lastRevision = "";
  }

  revisionCheckInFlight = true;
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("id, status, is_featured, updated_at")
      .eq("event_id", DEFAULT_EVENT_ID)
      .order("id", { ascending: true });

    if (error) return;

    const revision = JSON.stringify(data ?? []);
    if (!revisionInitialized) {
      revisionInitialized = true;
      lastRevision = revision;
      return;
    }

    if (revision === lastRevision) return;
    lastRevision = revision;

    if (Date.now() >= ignoreRealtimeUntil) scheduleRemoteRefresh();
  } finally {
    revisionCheckInFlight = false;
  }
}

function rememberLocalMemoryAction(event: Event) {
  const target = event.target;
  if (!(target instanceof Element) || !isRelevantRoute()) return;

  const button = target.closest<HTMLButtonElement>("button");
  if (!button) return;

  const label = normalizeText(button.textContent);
  const adminActions = new Set([
    "aprovar",
    "rejeitar",
    "ocultar",
    "destacar",
    "remover destaque",
  ]);

  const publicSubmit = isPublicMemoriesRoute()
    && (label === "enviar" || label === "enviar para moderação");

  if (!adminActions.has(label) && !publicSubmit) return;

  ignoreRealtimeUntil = Date.now() + LOCAL_ACTION_GRACE_MS;
  window.setTimeout(() => void checkMemoryRevision(), 1_200);
  window.setTimeout(() => void checkMemoryRevision(), 4_000);
  window.setTimeout(() => void checkMemoryRevision(), 7_500);
}

function handleRealtimeChange() {
  void checkMemoryRevision();
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") void checkMemoryRevision();
}

export function installMemorySyncEnhancements() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  document.addEventListener("click", rememberLocalMemoryAction, true);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", () => void checkMemoryRevision());
  window.addEventListener("popstate", () => void checkMemoryRevision());
  window.addEventListener("pushstate", () => void checkMemoryRevision());
  window.setInterval(() => void checkMemoryRevision(), REVISION_INTERVAL_MS);

  supabase
    .channel("hc-memories-ui-sync")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "memories",
        filter: `event_id=eq.${DEFAULT_EVENT_ID}`,
      },
      handleRealtimeChange,
    )
    .subscribe();

  void checkMemoryRevision();
}
