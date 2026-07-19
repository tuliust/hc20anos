import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const LOCAL_ACTION_GRACE_MS = 4_000;
const REMOTE_REFRESH_DELAY_MS = 450;

let installed = false;
let ignoreRealtimeUntil = 0;
let refreshTimer: number | null = null;

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

  if (adminActions.has(label) || publicSubmit) {
    ignoreRealtimeUntil = Date.now() + LOCAL_ACTION_GRACE_MS;
  }
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

export function installMemorySyncEnhancements() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  document.addEventListener("click", rememberLocalMemoryAction, true);

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
      scheduleRemoteRefresh,
    )
    .subscribe();
}
