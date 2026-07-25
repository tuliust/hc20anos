import { supabase } from "./lib/supabase";
import { getMyProfile } from "./lib/services";

const HOME_PATH = "/";
const HERO_SELECTOR = '[data-home-section="hero"]';
const STYLE_ID = "hc-home-landing-enhancements-style";
const ANONYMOUS_ATTENDANCE_KEY = "hc-attendance-confirmed";
const USER_ATTENDANCE_KEY_PREFIX = "hc-attendance-confirmed:";
const CONFIRMED_LABELS = new Set(["presenca marcada", "ja confirmado"]);

let observer: MutationObserver | null = null;
let scheduled = false;
let requestVersion = 0;
let currentUserId: string | null = null;
let attendanceConfirmed = false;
let attendanceButton: HTMLButtonElement | null = null;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function userAttendanceKey(userId: string): string {
  return `${USER_ATTENDANCE_KEY_PREFIX}${userId}`;
}

function readStoredFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStoredFlag(key: string, value: boolean): void {
  try {
    if (value) window.localStorage.setItem(key, "true");
    else window.localStorage.removeItem(key);
  } catch {
    // O estado persistido é apenas um fallback visual; o Supabase continua sendo a fonte principal.
  }
}

function injectAttendanceStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    ${HERO_SELECTOR} {
      margin-top: 0 !important;
      padding-top: 4rem !important;
    }

    ${HERO_SELECTOR} button[data-hc-attendance-confirmed="true"] {
      font-size: 0 !important;
      opacity: 0.78 !important;
      filter: saturate(0.62) !important;
    }

    ${HERO_SELECTOR} button[data-hc-attendance-confirmed="true"]::after {
      content: "Já confirmado";
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      line-height: 1.25rem;
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);
}

function findAttendanceButton(): HTMLButtonElement | null {
  const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
  if (!hero) return null;
  return hero.querySelectorAll<HTMLButtonElement>("button")[1] ?? null;
}

function findTicketsSection(): HTMLElement | null {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("section.home-section"));

  return sections.find(section => {
    const title = normalize(section.querySelector("h2")?.textContent);
    const eyebrow = normalize(section.querySelector("p")?.textContent);
    const buttonLabels = Array.from(section.querySelectorAll<HTMLButtonElement>("button"))
      .map(button => normalize(button.textContent));

    return eyebrow === "ingressos"
      || title.includes("garanta sua vaga")
      || buttonLabels.some(label => label === "comprar agora");
  }) ?? null;
}

function applyTicketsAppearance(): void {
  if (currentPath() !== HOME_PATH) return;

  const section = findTicketsSection();
  if (!section) return;

  section.dataset.homeSection = "tickets";
  section.style.setProperty("background", "#c9a84c", "important");

  const title = section.querySelector<HTMLHeadingElement>("h2");
  const eyebrow = title?.parentElement?.querySelector<HTMLParagraphElement>("p")
    ?? section.querySelector<HTMLParagraphElement>("p");

  eyebrow?.style.setProperty("color", "#343a36", "important");
  title?.style.setProperty("color", "#0d1a0f", "important");
}

function persistConfirmedAttendance(): void {
  writeStoredFlag(ANONYMOUS_ATTENDANCE_KEY, true);
  if (currentUserId) writeStoredFlag(userAttendanceKey(currentUserId), true);
}

function clearPersistedAttendance(): void {
  writeStoredFlag(ANONYMOUS_ATTENDANCE_KEY, false);
  if (currentUserId) writeStoredFlag(userAttendanceKey(currentUserId), false);
}

function syncConfirmedStateFromDom(button: HTMLButtonElement): void {
  const label = normalize(button.textContent);
  const completedByExistingMount = button.dataset.homeHeroUserState === "attendance";

  if (completedByExistingMount || CONFIRMED_LABELS.has(label)) {
    attendanceConfirmed = true;
    persistConfirmedAttendance();
  }
}

function handleAttendanceClick(): void {
  window.setTimeout(() => void refreshAttendanceState(), 700);
  window.setTimeout(() => void refreshAttendanceState(), 1800);
}

function applyAttendanceAppearance(): void {
  if (currentPath() !== HOME_PATH) return;

  const nextButton = findAttendanceButton();
  if (attendanceButton !== nextButton) {
    attendanceButton?.removeEventListener("click", handleAttendanceClick);
    attendanceButton = nextButton;
    attendanceButton?.addEventListener("click", handleAttendanceClick);
  }

  if (!attendanceButton) return;
  syncConfirmedStateFromDom(attendanceButton);

  if (attendanceConfirmed) {
    attendanceButton.dataset.hcAttendanceConfirmed = "true";
    attendanceButton.setAttribute("aria-pressed", "true");
    attendanceButton.setAttribute("aria-label", "Presença já confirmada");
  } else {
    delete attendanceButton.dataset.hcAttendanceConfirmed;
    attendanceButton.removeAttribute("aria-pressed");
    if (attendanceButton.getAttribute("aria-label") === "Presença já confirmada") {
      attendanceButton.removeAttribute("aria-label");
    }
  }
}

function enhanceHome(): void {
  scheduled = false;
  applyTicketsAppearance();
  applyAttendanceAppearance();
}

function scheduleEnhancement(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(enhanceHome);
}

async function refreshAttendanceState(): Promise<void> {
  const version = ++requestVersion;

  try {
    const { data } = await supabase.auth.getSession();
    if (version !== requestVersion) return;

    currentUserId = data.session?.user?.id ?? null;

    if (!currentUserId) {
      attendanceConfirmed = readStoredFlag(ANONYMOUS_ATTENDANCE_KEY);
      scheduleEnhancement();
      return;
    }

    try {
      const profile = await getMyProfile(currentUserId);
      if (version !== requestVersion) return;

      attendanceConfirmed = profile?.intends_to_attend === true;
      if (attendanceConfirmed) persistConfirmedAttendance();
      else clearPersistedAttendance();
    } catch (error) {
      console.warn("[Home] Não foi possível atualizar o estado persistido de presença.", error);
      attendanceConfirmed = readStoredFlag(userAttendanceKey(currentUserId))
        || readStoredFlag(ANONYMOUS_ATTENDANCE_KEY);
    }
  } catch (error) {
    console.warn("[Home] Não foi possível ler a sessão para atualizar a presença.", error);
    currentUserId = null;
    attendanceConfirmed = readStoredFlag(ANONYMOUS_ATTENDANCE_KEY);
  }

  scheduleEnhancement();
}

export function installHomeLandingEnhancements(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.documentElement.dataset.hcHomeLandingEnhancements === "true") return;
  document.documentElement.dataset.hcHomeLandingEnhancements = "true";

  injectAttendanceStyle();

  observer?.disconnect();
  observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.addEventListener("focus", () => void refreshAttendanceState());
  window.addEventListener("popstate", scheduleEnhancement);
  window.addEventListener("pushstate", scheduleEnhancement as EventListener);
  window.addEventListener("hc-hero-user-state-updated", () => void refreshAttendanceState());
  window.addEventListener("storage", event => {
    if (event.key === ANONYMOUS_ATTENDANCE_KEY || event.key?.startsWith(USER_ATTENDANCE_KEY_PREFIX)) {
      void refreshAttendanceState();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshAttendanceState();
  });

  supabase.auth.onAuthStateChange(() => {
    void refreshAttendanceState();
  });

  scheduleEnhancement();
  void refreshAttendanceState();
}
