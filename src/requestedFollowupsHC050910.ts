import { supabase } from "./lib/supabase";

const EVENT_INFO_LABELS = new Set(["data", "horario", "local"]);
const HERO_ORIGINAL_LABEL_ATTRIBUTE = "data-home-hero-original-label";
const HERO_ENHANCED_ATTRIBUTE = "data-home-hero-user-state";

let scheduled = false;
let externalAccount = false;
let externalLookupInFlight = false;
let sessionUserId: string | null = null;
let authTransitionTimer: number | null = null;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function markEventInfoCards() {
  if (currentPath() !== "/evento") return;

  Array.from(document.querySelectorAll<HTMLElement>("main p, main span, main h3"))
    .filter(element => EVENT_INFO_LABELS.has(normalize(element.textContent)))
    .forEach(label => {
      let card: HTMLElement | null = label.parentElement;
      for (let depth = 0; card && depth < 4; depth += 1) {
        const classes = String(card.className);
        if (classes.includes("border") && (classes.includes("bg-") || classes.includes("p-"))) break;
        card = card.parentElement;
      }
      if (card) card.dataset.hcEventInfoCard = "true";
    });
}

async function detectExternalAccount() {
  if (externalLookupInFlight) return;
  externalLookupInFlight = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      externalAccount = false;
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("person_id,people(person_type)")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const row = data as unknown as { people?: { person_type?: string } | Array<{ person_type?: string }> } | null;
    const person = Array.isArray(row?.people) ? row.people[0] : row?.people;
    externalAccount = person?.person_type === "external";
  } catch {
    externalAccount = false;
  } finally {
    externalLookupInFlight = false;
    schedule();
  }
}

function applyExternalCheckoutComposition() {
  if (currentPath() !== "/checkout" || !externalAccount) {
    document.documentElement.removeAttribute("data-hc-hc09-external");
    return;
  }

  document.documentElement.setAttribute("data-hc-hc09-external", "true");

  const headings = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2, main h3"));
  const heading = headings.find(element => {
    const text = normalize(element.textContent);
    return text === "seu ingresso" || text === "quem vai com voce?" || text === "seu ingresso e acompanhantes";
  });
  if (heading) {
    heading.textContent = "Seu ingresso e acompanhantes";
    const description = heading.parentElement?.querySelector<HTMLParagraphElement>("p");
    if (description) {
      description.textContent = "Como Usuário Externo, você pode incluir um adulto/pessoa adicional e filhos. O valor dos filhos é calculado pela idade na data do evento.";
    }
    const headerRow = heading.parentElement?.parentElement;
    headerRow?.querySelector<HTMLElement>("span.font-mono")?.removeAttribute("data-hc-external-hidden");
  }

  Array.from(document.querySelectorAll<HTMLButtonElement>("main button")).forEach(button => {
    const text = normalize(button.textContent);
    if (text === "adicionar conjuge" || text === "adicionar adulto/pessoa adicional") {
      button.textContent = "Adicionar adulto/pessoa adicional";
      button.removeAttribute("data-hc-external-hidden");
    } else if (text === "remover conjuge" || text === "remover adulto/pessoa adicional") {
      button.textContent = "Remover adulto/pessoa adicional";
      button.removeAttribute("data-hc-external-hidden");
    } else if (text.includes("adicionar filho")) {
      button.removeAttribute("data-hc-external-hidden");
    }
  });

  Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .filter(element => normalize(element.textContent) === "conjuge")
    .forEach(element => { element.textContent = "Adulto/pessoa adicional"; });

  Array.from(document.querySelectorAll<HTMLInputElement>('main input[placeholder="E-mail do cônjuge (opcional)"]'))
    .forEach(input => { input.placeholder = "E-mail do adulto adicional (opcional)"; });
}

function restoreHeroButtonsForAnonymousState() {
  const hero = document.querySelector<HTMLElement>('[data-home-section="hero"]');
  if (!hero) return;
  Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).forEach(button => {
    const original = button.getAttribute(HERO_ORIGINAL_LABEL_ATTRIBUTE);
    if (original) button.textContent = original;
    button.removeAttribute(HERO_ENHANCED_ATTRIBUTE);
    button.removeAttribute("aria-disabled");
    button.removeAttribute("aria-haspopup");
    button.style.removeProperty("cursor");
    button.style.removeProperty("opacity");
    button.style.removeProperty("filter");
  });
}

function enforceAuthTransitionState() {
  if (currentPath() !== "/") return;
  if (document.documentElement.dataset.hcAuthTransition === "true" || document.documentElement.dataset.hcSignedOut === "true") {
    restoreHeroButtonsForAnonymousState();
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    markEventInfoCards();
    applyExternalCheckoutComposition();
    enforceAuthTransitionState();
  });
}

function refreshForRoute() {
  if (currentPath() === "/checkout") void detectExternalAccount();
  schedule();
}

export function installRequestedFollowupsHC050910() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcRequestedFollowups050910 === "true") return;
  document.documentElement.dataset.hcRequestedFollowups050910 = "true";

  const start = async () => {
    if (!document.body) return;
    const { data: { session } } = await supabase.auth.getSession();
    sessionUserId = session?.user?.id ?? null;
    if (!sessionUserId) document.documentElement.dataset.hcSignedOut = "true";

    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("popstate", refreshForRoute);
    window.addEventListener("pushstate", refreshForRoute as EventListener);

    supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;
      const switchedUser = Boolean(nextUserId && sessionUserId && nextUserId !== sessionUserId);
      sessionUserId = nextUserId;

      if (event === "SIGNED_OUT" || !nextUserId) {
        document.documentElement.dataset.hcSignedOut = "true";
        document.documentElement.removeAttribute("data-hc-auth-transition");
        restoreHeroButtonsForAnonymousState();
        schedule();
        return;
      }

      document.documentElement.removeAttribute("data-hc-signed-out");
      if (event === "SIGNED_IN" || switchedUser) {
        document.documentElement.dataset.hcAuthTransition = "true";
        restoreHeroButtonsForAnonymousState();
        window.dispatchEvent(new Event("hc-hero-user-state-updated"));
        if (authTransitionTimer !== null) window.clearTimeout(authTransitionTimer);
        authTransitionTimer = window.setTimeout(() => {
          document.documentElement.removeAttribute("data-hc-auth-transition");
          window.dispatchEvent(new Event("hc-hero-user-state-updated"));
          schedule();
        }, 900);
      }

      if (currentPath() === "/checkout") void detectExternalAccount();
      schedule();
    });

    refreshForRoute();
  };

  if (document.body) void start();
  else window.addEventListener("DOMContentLoaded", () => { void start(); }, { once: true });
}
