import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, RefreshCw, ShoppingBag, Ticket, UserCheck, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getMyOrders, getMyProfile, getMyTickets, saveMyPublicProfile } from "../lib/services";

const HOME_PATH = "/";
const HERO_SELECTOR = '[data-home-section="hero"]';
const ORIGINAL_LABEL_ATTRIBUTE = "data-home-hero-original-label";
const ENHANCED_ATTRIBUTE = "data-home-hero-user-state";

type ModalKind = "purchase" | "attendance" | null;

type HeroButtons = {
  purchase: HTMLButtonElement | null;
  attendance: HTMLButtonElement | null;
};

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function findHeroButtons(): HeroButtons {
  const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
  if (!hero) return { purchase: null, attendance: null };

  const buttons = Array.from(hero.querySelectorAll<HTMLButtonElement>("button"));
  return {
    purchase: buttons[0] ?? null,
    attendance: buttons[1] ?? null,
  };
}

function rememberOriginalLabel(button: HTMLButtonElement) {
  if (!button.hasAttribute(ORIGINAL_LABEL_ATTRIBUTE)) {
    button.setAttribute(ORIGINAL_LABEL_ATTRIBUTE, String(button.textContent ?? "").replace(/\s+/g, " ").trim());
  }
}

function setButtonLabel(button: HTMLButtonElement, label: string) {
  if (String(button.textContent ?? "").replace(/\s+/g, " ").trim() !== label) {
    button.textContent = label;
  }
}

function applyCompletedState(button: HTMLButtonElement, kind: Exclude<ModalKind, null>, label: string) {
  rememberOriginalLabel(button);
  setButtonLabel(button, label);
  button.setAttribute(ENHANCED_ATTRIBUTE, kind);
  button.setAttribute("aria-disabled", "true");
  button.setAttribute("aria-haspopup", "dialog");
  button.style.setProperty("cursor", "pointer");
  button.style.setProperty("opacity", "0.72");
  button.style.setProperty("filter", "saturate(0.55)");
}

function restoreButton(button: HTMLButtonElement) {
  const originalLabel = button.getAttribute(ORIGINAL_LABEL_ATTRIBUTE);
  if (originalLabel) setButtonLabel(button, originalLabel);
  button.removeAttribute(ENHANCED_ATTRIBUTE);
  button.removeAttribute("aria-disabled");
  button.removeAttribute("aria-haspopup");
  button.style.removeProperty("cursor");
  button.style.removeProperty("opacity");
  button.style.removeProperty("filter");
}

function hasUsableTicket(ticket: Record<string, unknown>) {
  const order = ticket.orders && typeof ticket.orders === "object"
    ? ticket.orders as Record<string, unknown>
    : {};
  const paymentStatus = String(order.payment_status ?? "").toLocaleLowerCase("pt-BR");
  const ticketStatus = String(ticket.status ?? "valid").toLocaleLowerCase("pt-BR");

  if (["cancelled", "refunded", "removed", "void"].includes(ticketStatus)) return false;
  return !paymentStatus || paymentStatus === "approved";
}

function HeroStateModal({
  kind,
  busy,
  error,
  onClose,
  onBuyAnother,
  onViewTickets,
  onRemoveAttendance,
}: {
  kind: Exclude<ModalKind, null>;
  busy: boolean;
  error: string;
  onClose: () => void;
  onBuyAnother: () => void;
  onViewTickets: () => void;
  onRemoveAttendance: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  const purchase = kind === "purchase";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050a05]/85 px-4 py-8 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-hero-state-modal-title"
        className="relative w-full max-w-lg border border-[#2d6a4f]/45 bg-[#101a10] p-6 shadow-2xl md:p-8"
      >
        <button
          type="button"
          aria-label="Fechar"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[#2d6a4f]/30 text-[#7a9a7a] transition-colors hover:border-[#c9a84c] hover:text-[#f0ebe0] disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a84c]/45 bg-[#0d1a0f] text-[#c9a84c]">
          {purchase ? <ShoppingBag size={23} /> : <UserCheck size={23} />}
        </div>

        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a84c]">
          {purchase ? "Ingressos" : "Presença"}
        </p>
        <h2 id="home-hero-state-modal-title" className="mt-3 pr-10 font-['Playfair_Display'] text-3xl font-bold leading-tight text-[#f0ebe0]">
          {purchase ? "Você já realizou uma compra" : "Você já confirmou presença"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#7a9a7a]">
          {purchase
            ? "A compra já está vinculada à sua conta. Você pode adquirir outro ingresso ou consultar os ingressos existentes."
            : "Sua intenção de participar está registrada no perfil. A confirmação pode ser removida abaixo."}
        </p>

        {error && (
          <p role="alert" className="mt-5 border border-[#c0392b]/45 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#e74c3c]">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {purchase ? (
            <>
              <button
                type="button"
                onClick={onBuyAnother}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#2d6a4f] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f0ebe0]"
              >
                <ShoppingBag size={16} />Comprar outro ingresso
              </button>
              <button
                type="button"
                onClick={onViewTickets}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-[#2d6a4f]/55 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f0ebe0]"
              >
                <Ticket size={16} />Ver meus ingressos
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onRemoveAttendance}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#c9a84c]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#c9a84c] disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {busy ? "Removendo..." : "Remover minha confirmação"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export function HomeHeroUserStateMount() {
  const [user, setUser] = useState<User | null>(null);
  const [hasPurchase, setHasPurchase] = useState(false);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  const refreshStatus = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!user?.id) {
      setHasPurchase(false);
      setHasAttendance(false);
      setStatusLoaded(true);
      return;
    }

    setStatusLoaded(false);
    try {
      const [tickets, orders, profile] = await Promise.all([
        getMyTickets(user.id, user.email ?? undefined),
        getMyOrders(user.id, user.email ?? undefined),
        getMyProfile(user.id),
      ]);
      if (version !== requestVersion.current) return;

      const purchased = tickets.some(ticket => hasUsableTicket(ticket as unknown as Record<string, unknown>))
        || orders.some(order => String(order.payment_status).toLocaleLowerCase("pt-BR") === "approved");
      setHasPurchase(purchased);
      setHasAttendance(profile?.intends_to_attend === true);
    } catch (statusError) {
      console.warn("[Home/Hero] Não foi possível carregar compra e confirmação do usuário.", statusError);
      if (version === requestVersion.current) {
        setHasPurchase(false);
        setHasAttendance(false);
      }
    } finally {
      if (version === requestVersion.current) setStatusLoaded(true);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const refresh = () => void refreshStatus();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("popstate", refresh);
    window.addEventListener("pushstate", refresh);
    window.addEventListener("hc-hero-user-state-updated", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("popstate", refresh);
      window.removeEventListener("pushstate", refresh);
      window.removeEventListener("hc-hero-user-state-updated", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshStatus]);

  useEffect(() => {
    let scheduled = false;
    let purchaseButton: HTMLButtonElement | null = null;
    let attendanceButton: HTMLButtonElement | null = null;

    const handlePurchase = (event: Event) => {
      if (!hasPurchase || !statusLoaded) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setError("");
      setModal("purchase");
    };

    const handleAttendance = (event: Event) => {
      if (!hasAttendance || !statusLoaded) {
        window.setTimeout(() => void refreshStatus(), 700);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setError("");
      setModal("attendance");
    };

    const bind = () => {
      scheduled = false;
      if (currentPath() !== HOME_PATH) return;
      const next = findHeroButtons();

      if (purchaseButton !== next.purchase) {
        purchaseButton?.removeEventListener("click", handlePurchase, true);
        purchaseButton = next.purchase;
        purchaseButton?.addEventListener("click", handlePurchase, true);
      }
      if (attendanceButton !== next.attendance) {
        attendanceButton?.removeEventListener("click", handleAttendance, true);
        attendanceButton = next.attendance;
        attendanceButton?.addEventListener("click", handleAttendance, true);
      }

      if (purchaseButton) {
        if (user && statusLoaded && hasPurchase) applyCompletedState(purchaseButton, "purchase", "Compra feita!");
        else restoreButton(purchaseButton);
      }
      if (attendanceButton) {
        if (user && statusLoaded && hasAttendance) applyCompletedState(attendanceButton, "attendance", "Já confirmado");
        else restoreButton(attendanceButton);
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(bind);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();

    return () => {
      observer.disconnect();
      purchaseButton?.removeEventListener("click", handlePurchase, true);
      attendanceButton?.removeEventListener("click", handleAttendance, true);
      if (purchaseButton) restoreButton(purchaseButton);
      if (attendanceButton) restoreButton(attendanceButton);
    };
  }, [hasAttendance, hasPurchase, refreshStatus, statusLoaded, user]);

  const closeModal = useCallback(() => {
    if (busy) return;
    setModal(null);
    setError("");
  }, [busy]);

  async function removeAttendance() {
    if (!user?.id) return;
    setBusy(true);
    setError("");
    try {
      await saveMyPublicProfile(user.id, { intends_to_attend: false });
      setHasAttendance(false);
      setModal(null);
      window.dispatchEvent(new Event("hc-hero-user-state-updated"));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Não foi possível remover a confirmação.");
    } finally {
      setBusy(false);
    }
  }

  if (!modal || typeof document === "undefined") return null;

  return createPortal(
    <HeroStateModal
      kind={modal}
      busy={busy}
      error={error}
      onClose={closeModal}
      onBuyAnother={() => window.location.assign("/ingressos")}
      onViewTickets={() => window.location.assign("/meus-ingressos")}
      onRemoveAttendance={() => void removeAttendance()}
    />,
    document.body,
  );
}
