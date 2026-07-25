import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const PROFILE_METRICS_SELECTOR = "[data-home-profile-metrics]";
const CACHE_TTL_MS = 30_000;

type CountItem = {
  label: string;
  count: number;
};

type HomeProfileMetrics = {
  women: number;
  married: number;
  children: number;
};

let installed = false;
let scheduled = false;
let cachedMetrics: HomeProfileMetrics | null = null;
let cachedAt = 0;
let pendingRequest: Promise<HomeProfileMetrics> | null = null;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function percentOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function parseCounts(value: unknown): CountItem[] {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(item => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        label: String(row.label ?? ""),
        count: Number(row.count ?? 0),
      };
    })
    .filter(item => item.label && Number.isFinite(item.count));
}

function isRegisteredPerson(person: Record<string, unknown>) {
  const status = normalize(person.profile_status);
  return status === "claimed"
    || status === "confirmed"
    || Boolean(person.claimed_by_user_id);
}

async function loadMetrics(force = false): Promise<HomeProfileMetrics> {
  const now = Date.now();
  if (!force && cachedMetrics && now - cachedAt < CACHE_TTL_MS) return cachedMetrics;
  if (pendingRequest) return pendingRequest;

  pendingRequest = (async () => {
    const [peopleResult, statsResult] = await Promise.all([
      (supabase as any)
        .from("people")
        .select("gender,is_visible,profile_status,claimed_by_user_id"),
      (supabase as any)
        .from("public_curiosity_profile_stats")
        .select("total_registered,total_with_children,relationship_status_counts")
        .eq("event_id", DEFAULT_EVENT_ID)
        .maybeSingle(),
    ]);

    if (peopleResult.error) throw peopleResult.error;
    if (statsResult.error) throw statsResult.error;

    const registeredPeople = (Array.isArray(peopleResult.data) ? peopleResult.data : [])
      .filter((person: Record<string, unknown>) => person.is_visible !== false)
      .filter(isRegisteredPerson);
    const stats = statsResult.data && typeof statsResult.data === "object"
      ? statsResult.data as Record<string, unknown>
      : {};

    const registeredTotalFromView = Number(stats.total_registered);
    const registeredTotal = Number.isFinite(registeredTotalFromView)
      ? registeredTotalFromView
      : registeredPeople.length;
    const womenCount = registeredPeople
      .filter((person: Record<string, unknown>) => person.gender === "female")
      .length;
    const marriedCount = parseCounts(stats.relationship_status_counts)
      .find(item => normalize(item.label).startsWith("casad"))?.count ?? 0;
    const childrenCount = Number(stats.total_with_children ?? 0);

    const metrics: HomeProfileMetrics = {
      women: percentOf(womenCount, registeredTotal),
      married: percentOf(marriedCount, registeredTotal),
      children: percentOf(Number.isFinite(childrenCount) ? childrenCount : 0, registeredTotal),
    };

    cachedMetrics = metrics;
    cachedAt = Date.now();
    return metrics;
  })().finally(() => {
    pendingRequest = null;
  });

  return pendingRequest;
}

function applyMetrics(root: HTMLElement, metrics: HomeProfileMetrics) {
  const values = [metrics.women, metrics.married, metrics.children];
  const cards = Array.from(root.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .slice(0, values.length);

  cards.forEach((card, index) => {
    const valueElement = card.querySelector<HTMLParagraphElement>("p");
    if (!valueElement) return;
    const nextValue = `${values[index]}%`;
    if (valueElement.textContent !== nextValue) valueElement.textContent = nextValue;
  });

  root.setAttribute("data-home-profile-metrics-source", "registered-profiles");
}

async function refreshMetrics(force = false) {
  if (currentPath() !== "/") return;
  const root = document.querySelector<HTMLElement>(PROFILE_METRICS_SELECTOR);
  if (!root) return;

  try {
    applyMetrics(root, await loadMetrics(force));
  } catch (error) {
    console.warn("[Home/Perfil] Não foi possível atualizar as métricas dos perfis cadastrados.", error);
  }
}

function scheduleRefresh(force = false) {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => {
    scheduled = false;
    void refreshMetrics(force);
  }, 0);
}

export function installHomeProfileMetricsEnhancements() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const observer = new MutationObserver(() => scheduleRefresh(false));
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", () => scheduleRefresh(false));
  window.addEventListener("pushstate", () => scheduleRefresh(false));
  window.addEventListener("focus", () => scheduleRefresh(true));
  window.addEventListener("hc-home-profile-metrics-updated", () => scheduleRefresh(true));

  window.setInterval(() => {
    if (document.visibilityState === "visible") scheduleRefresh(true);
  }, 60_000);

  scheduleRefresh(true);
}
