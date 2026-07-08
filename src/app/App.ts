import React, { useEffect, useState } from "react";
import OriginalApp from "./App.tsx";
import { getEventSettings, getHomePageContent, getTicketTypes, HOME_PAGE_CONTENT_DEFAULTS, type HomePageContent } from "../lib/services";
import type { DbEvent, DbTicketType, TicketStatus } from "../lib/database.types";
import { ArrowRight, Calendar, Check, ChevronDown, Clock, MapPin, Menu, Ticket, X } from "lucide-react";

const h = React.createElement;
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const FALLBACK_EVENT_DATE_TIME = "2026-10-17T19:00:00-03:00";
const NAV_EVENT = "hc20anos:navigation";

type VisualTicketStatus = "available" | "last-units" | "sold-out";

function normalizedPathname() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function notifyNavigation() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAV_EVENT));
}

function installHistoryListener() {
  if (typeof window === "undefined") return;
  const historyWithPatch = window.history as History & {
    __hc20NavigationPatched?: boolean;
    __hc20OriginalPushState?: History["pushState"];
    __hc20OriginalReplaceState?: History["replaceState"];
  };
  if (historyWithPatch.__hc20NavigationPatched) return;

  historyWithPatch.__hc20NavigationPatched = true;
  historyWithPatch.__hc20OriginalPushState = window.history.pushState;
  historyWithPatch.__hc20OriginalReplaceState = window.history.replaceState;

  window.history.pushState = function pushStateWithEvent(...args: Parameters<History["pushState"]>) {
    const result = historyWithPatch.__hc20OriginalPushState?.apply(this, args);
    notifyNavigation();
    return result;
  } as History["pushState"];

  window.history.replaceState = function replaceStateWithEvent(...args: Parameters<History["replaceState"]>) {
    const result = historyWithPatch.__hc20OriginalReplaceState?.apply(this, args);
    notifyNavigation();
    return result;
  } as History["replaceState"];
}

function usePathname() {
  const [pathname, setPathname] = useState(normalizedPathname);

  useEffect(() => {
    installHistoryListener();
    const update = () => setPathname(normalizedPathname());
    window.addEventListener("popstate", update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);

  return pathname;
}

function navigateTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  notifyNavigation();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getEventDateTime(event?: DbEvent | null): Date {
  const fallback = new Date(FALLBACK_EVENT_DATE_TIME);
  if (!event?.event_date) return fallback;

  const datePart = event.event_date.includes("T") ? event.event_date.slice(0, 10) : event.event_date;
  const rawTime = event.event_time?.trim() || "19:00:00";
  const normalizedTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime.slice(0, 8);
  const eventDate = new Date(`${datePart}T${normalizedTime}-03:00`);

  return Number.isNaN(eventDate.getTime()) ? fallback : eventDate;
}

function getTimeLeft(eventDateTime: Date) {
  const diff = eventDateTime.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function formatLongDateBR(value?: string | null) {
  if (!value) return "Sábado, 17 de Outubro de 2026";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function formatTimeLabel(value?: string | null, fallback = "19h00") {
  if (!value) return fallback;
  const [hour, minute = "00"] = value.split(":");
  if (!hour) return fallback;
  return `${hour.padStart(2, "0")}h${minute.padStart(2, "0")}`;
}

function addMinutesToTime(value: string | null | undefined, offsetMinutes: number, fallback: string) {
  if (!value) return fallback;
  const [hourRaw, minuteRaw = "0"] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
  const total = (hour * 60 + minute + offsetMinutes + 1440) % 1440;
  const nextHour = Math.floor(total / 60);
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, "0")}h${String(nextMinute).padStart(2, "0")}`;
}

function formatCurrencyBR(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getTicketAvailability(ticket: DbTicketType) {
  return Math.max(0, ticket.available_quantity - ticket.sold_quantity);
}

function isTicketVisibleOnHome(ticket: DbTicketType) {
  return !( ["draft", "closed", "paused"] as TicketStatus[] ).includes(ticket.status);
}

function getTicketVisualStatus(ticket: DbTicketType): VisualTicketStatus {
  const availability = getTicketAvailability(ticket);
  if (ticket.status === "sold_out" || availability <= 0) return "sold-out";
  if (availability <= 10) return "last-units";
  return "available";
}

function getTicketDescriptionItems(description?: string | null) {
  const items = (description ?? "")
    .split(/\r?\n|;/)
    .map(item => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : ["Detalhes do lote serão informados pela organização."];
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Btn({ children, onClick, variant = "primary", disabled = false, full = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "gold";
  disabled?: boolean;
  full?: boolean;
}) {
  const variants = {
    primary: "bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c]",
    outline: "border border-[#f0ebe0] text-[#f0ebe0] hover:bg-[#f0ebe0] hover:text-[#0d1a0f]",
    ghost: "text-[#7a9a7a] hover:text-[#f0ebe0] hover:bg-[#1a2e1a]",
    gold: "bg-[#c9a84c] text-[#0d1a0f] hover:bg-[#e0bf6a]",
  };
  return h("button", {
    onClick,
    disabled,
    className: cx(
      "inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
      variants[variant],
      full && "w-full",
    ),
  }, children);
}

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return h("p", {
    className: cx("text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5", dark && "text-[#2d6a4f]"),
  }, children);
}

function DisplayTitle({ children, dark = false, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return h("h2", {
    className: cx("font-['Playfair_Display'] font-black leading-tight", dark ? "text-[#0d1a0f]" : "text-[#f0ebe0]", className),
  }, children);
}

function StatusBadge({ status }: { status: VisualTicketStatus }) {
  const map: Record<VisualTicketStatus, { label: string; color: string }> = {
    available: { label: "Disponível", color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50" },
    "last-units": { label: "Últimas unidades", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40" },
    "sold-out": { label: "Esgotado", color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30" },
  };
  const selected = map[status];
  return h("span", {
    className: `inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${selected.color}`,
  }, selected.label);
}

function Header({ content }: { content: HomePageContent }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Home", "/"],
    ["Ingressos", "/ingressos"],
    ["Quem Vai", "/quem-vai"],
    ["Fotos", "/fotos"],
    ["Admin", "/admin"],
  ] as const;

  const logo = content.header_logo_url
    ? h("img", { src: content.header_logo_url, alt: "Turma 2006", className: "h-16 w-32 object-contain" })
    : h("div", { className: "flex items-center gap-4" },
        h("div", { className: "relative h-12 w-12 rounded-full border border-[#c9a84c]/70 bg-[#0d1a0f] flex items-center justify-center" },
          h("span", { className: "font-['Playfair_Display'] text-[#c9a84c] text-xl font-black leading-none" }, "HC"),
          h("span", { className: "absolute -bottom-1 -right-1 bg-[#c9a84c] text-[#0d1a0f] font-mono text-[8px] font-black px-1 leading-4" }, "20"),
        ),
        h("div", { className: "hidden lg:block" },
          h("p", { className: "font-['Playfair_Display'] font-black text-[#f0ebe0] text-base leading-tight tracking-wide uppercase" }, "Turma 2006"),
          h("p", { className: "text-[#7a9a7a] font-mono text-[10px] uppercase tracking-[0.25em] leading-none mt-1" }, "20 anos"),
        ),
      );

  return h(React.Fragment, null,
    h("header", { className: "fixed top-0 left-0 right-0 z-50 bg-[#080f08]/95 backdrop-blur-md border-b border-[#2d6a4f]/20" },
      h("div", { className: "max-w-7xl mx-auto px-4 h-16 flex items-center justify-between" },
        h("button", { onClick: () => navigateTo("/"), className: "flex items-center gap-4 shrink-0 text-left" }, logo),
        h("nav", { className: "hidden md:flex items-center gap-5 xl:gap-6" },
          links.map(([label, path]) => h("button", {
            key: path,
            onClick: () => navigateTo(path),
            className: "text-sm xl:text-[15px] font-mono font-bold uppercase tracking-[0.12em] whitespace-nowrap leading-none text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors",
          }, label)),
        ),
        h("div", { className: "flex items-center gap-3" },
          h(Btn, { onClick: () => navigateTo("/ingressos") }, "Comprar ingresso"),
          h("button", { onClick: () => setOpen(!open), className: "md:hidden text-[#f0ebe0] p-2" }, open ? h(X, { size: 22 }) : h(Menu, { size: 22 })),
        ),
      ),
    ),
    open && h("div", { className: "fixed inset-0 z-40 bg-[#080f08] flex flex-col pt-24 px-6 pb-8 md:hidden" },
      links.map(([label, path]) => h("button", {
        key: path,
        onClick: () => { setOpen(false); navigateTo(path); },
        className: "text-left py-5 border-b border-[#2d6a4f]/20 text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold hover:text-[#c9a84c] transition-colors",
      }, label)),
    ),
  );
}

function Hero({ content, event }: { content: HomePageContent; event: DbEvent | null }) {
  const [time, setTime] = useState(() => getTimeLeft(getEventDateTime(event)));

  useEffect(() => {
    const update = () => setTime(getTimeLeft(getEventDateTime(event)));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [event]);

  return h("section", {
    className: "relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-10 md:pt-24 md:pb-8",
    style: { background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" },
  },
    h("div", { className: "absolute inset-0 opacity-[0.06]", style: { backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "80px 80px" } }),
    h("div", { className: "relative z-10 text-center px-4 max-w-5xl w-full mx-auto" },
      h("p", { className: "text-[#c9a84c] tracking-[0.5em] text-[10px] md:text-xs font-mono font-bold uppercase mb-4 md:mb-5" }, content.hero_eyebrow),
      h("h1", { className: "font-['Playfair_Display'] font-black text-[#f0ebe0] uppercase leading-[0.86] tracking-tight", style: { fontSize: "clamp(3rem, 10vw, 8rem)" } }, content.hero_title),
      h("p", { className: "font-['Playfair_Display'] font-light italic text-[#c9a84c] leading-tight mt-2", style: { fontSize: "clamp(1.15rem, 3.2vw, 2.2rem)" } }, content.hero_tagline),
      h("div", { className: "w-20 h-px bg-[#c9a84c] mx-auto my-4 md:my-5 opacity-50" }),
      h("p", { className: "text-[#8ab89a] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-4" }, content.hero_subtitle),
      h("p", { className: "text-[#f0ebe0] font-mono text-sm md:text-[15px] tracking-[0.24em] uppercase opacity-75 mt-1 mb-10 md:mb-12" }, content.hero_event_line),
      h("div", { className: "flex flex-col sm:flex-row gap-4 justify-center mb-10 md:mb-12" },
        h(Btn, { onClick: () => navigateTo("/ingressos") }, content.primary_cta_label),
        h(Btn, { variant: "outline", onClick: () => navigateTo("/quem-vai") }, content.secondary_cta_label),
      ),
      h("div", { className: "inline-flex" },
        [
          { v: time.days, l: "Dias" },
          { v: time.hours, l: "Horas" },
          { v: time.minutes, l: "Min" },
          { v: time.seconds, l: "Seg" },
        ].map(({ v, l }, index) => h("div", { key: l, className: "flex items-center" },
          index > 0 && h("span", { className: "text-[#2d6a4f] font-mono text-3xl md:text-4xl mx-3 md:mx-6 font-light" }, ":"),
          h("div", { className: "text-center" },
            h("div", { className: "font-['JetBrains_Mono'] text-4xl md:text-6xl font-bold text-[#f0ebe0] tabular-nums" }, String(v).padStart(2, "0")),
            h("div", { className: "text-[#c9a84c] text-[9px] tracking-[0.3em] uppercase font-mono mt-1" }, l),
          ),
        )),
      ),
    ),
    h("div", { className: "absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 animate-bounce" }, h(ChevronDown, { className: "text-[#c9a84c] opacity-50", size: 20 })),
  );
}

function EventInfoSection({ content, event }: { content: HomePageContent; event: DbEvent | null }) {
  const eventTime = event?.event_time ?? null;
  const startTime = formatTimeLabel(eventTime);
  const fallbackEndTime = event ? startTime : "19h00 — 01h00";
  const doorsOpen = addMinutesToTime(eventTime, -30, "18h30");
  const dinnerService = addMinutesToTime(eventTime, 60, "20h00");
  const locationName = event?.location_name?.trim() || "Espaço Cultural Ponta Negra";
  const locationAddress = event?.location_address?.trim() || "Av. Eng. Roberto Freire — Ponta Negra, Natal/RN";

  const cards = [
    { icon: h(Calendar, { size: 24 }), title: "Data", info: formatLongDateBR(event?.event_date), sub: `Portas abertas às ${doorsOpen}` },
    { icon: h(Clock, { size: 24 }), title: "Horário", info: fallbackEndTime, sub: `Jantar servido a partir das ${dinnerService}` },
    { icon: h(MapPin, { size: 24 }), title: "Local", info: locationName, sub: locationAddress },
  ];

  return h("section", { className: "bg-[#f0ebe0] py-20 md:py-28" },
    h("div", { className: "max-w-7xl mx-auto px-4" },
      h(SectionLabel, { dark: true }, content.info_eyebrow),
      h(DisplayTitle, { dark: true, className: "text-4xl md:text-5xl mb-12" }, content.info_title),
      h("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
        cards.map(card => h("div", { key: card.title, className: "bg-[#0d1a0f] p-8" },
          h("div", { className: "text-[#c9a84c] mb-4" }, card.icon),
          h("p", { className: "text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-2" }, card.title),
          h("p", { className: "text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-2" }, card.info),
          h("p", { className: "text-[#7a9a7a] text-sm" }, card.sub),
        )),
      ),
    ),
  );
}

function TicketsPreview({ content, ticketTypes }: { content: HomePageContent; ticketTypes: DbTicketType[] }) {
  const publicTickets = ticketTypes.filter(isTicketVisibleOnHome);

  return h("section", { className: "bg-[#0a120a] py-20 md:py-28" },
    h("div", { className: "max-w-7xl mx-auto px-4" },
      h("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12" },
        h("div", null,
          h(SectionLabel, null, content.tickets_eyebrow),
          h(DisplayTitle, { className: "text-4xl md:text-5xl" }, content.tickets_title),
        ),
        h(Btn, { variant: "ghost", onClick: () => navigateTo("/ingressos") }, "Ver todos ", h(ArrowRight, { size: 16 })),
      ),
      publicTickets.length === 0
        ? h("div", { className: "flex flex-col items-center justify-center py-20 gap-4 text-center" },
            h("div", { className: "text-[#3a5a3a]" }, h(Ticket, { size: 40 })),
            h("p", { className: "text-[#7a9a7a] font-mono text-sm uppercase tracking-wider" }, "Ingressos em breve"),
            h("p", { className: "text-[#3a5a3a] text-xs" }, "Os lotes ativos cadastrados no painel aparecerão aqui."),
            h(Btn, { variant: "outline", onClick: () => navigateTo("/ingressos") }, "Abrir página de ingressos"),
          )
        : h("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
            publicTickets.map(ticket => {
              const availability = getTicketAvailability(ticket);
              const visualStatus = getTicketVisualStatus(ticket);
              const disabled = visualStatus === "sold-out";
              const items = getTicketDescriptionItems(ticket.description);
              return h("div", {
                key: ticket.id,
                className: cx(
                  "bg-[#141f14] border p-8 flex flex-col gap-4 transition-colors",
                  disabled ? "border-[#c0392b]/20 opacity-60" : visualStatus === "last-units" ? "border-[#c9a84c]/50 hover:border-[#c9a84c]/80" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60",
                ),
              },
                h("div", { className: "flex items-start justify-between gap-4" },
                  h("div", null,
                    h("p", { className: "text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest" }, `${availability}/${ticket.available_quantity} restantes`),
                    h("p", { className: "text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mt-1" }, ticket.name),
                  ),
                  h(StatusBadge, { status: visualStatus }),
                ),
                h("div", { className: "border-t border-[#2d6a4f]/20 pt-4" },
                  h("p", { className: "font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl" }, formatCurrencyBR(ticket.price_cents)),
                ),
                h("ul", { className: "flex flex-col gap-2" },
                  items.map(item => h("li", { key: `${ticket.id}-${item}`, className: "flex items-start gap-2 text-[#7a9a7a] text-xs" },
                    h(Check, { size: 12, className: "text-[#2d6a4f] mt-0.5 shrink-0" }),
                    item,
                  )),
                ),
                h("div", { className: "mt-auto" },
                  h(Btn, {
                    full: true,
                    disabled,
                    variant: visualStatus === "last-units" ? "gold" : "primary",
                    onClick: () => navigateTo("/ingressos"),
                  }, disabled ? "Esgotado" : "Comprar agora"),
                ),
              );
            }),
          ),
    ),
  );
}

function AboutSection({ content }: { content: HomePageContent }) {
  return h("section", { className: "bg-[#0d1a0f] py-20 md:py-28" },
    h("div", { className: "max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center" },
      h("div", null,
        h(SectionLabel, null, content.about_eyebrow),
        h(DisplayTitle, { className: "text-4xl md:text-5xl mb-6" }, content.about_title),
        h("div", { className: "w-16 h-px bg-[#c9a84c] opacity-60 my-6" }),
        h("p", { className: "text-[#8ab89a] text-base leading-relaxed mb-4" }, content.about_body_1),
        h("p", { className: "text-[#8ab89a] text-base leading-relaxed" }, content.about_body_2),
      ),
      h("div", { className: "grid grid-cols-2 gap-4" },
        [["84", "Ex-alunos localizados"], ["67%", "Já confirmaram presença"], ["12", "Estados representados"], ["2006", "O ano que não esquecemos"]].map(([number, label]) =>
          h("div", { key: label, className: "border border-[#2d6a4f]/30 p-6 bg-[#141f14]" },
            h("p", { className: "font-['Playfair_Display'] font-black text-[#c9a84c] text-4xl md:text-5xl mb-2" }, number),
            h("p", { className: "text-[#7a9a7a] text-xs font-mono uppercase tracking-wider leading-tight" }, label),
          ),
        ),
      ),
    ),
  );
}

function Footer() {
  return h("footer", { className: "bg-[#080f08] border-t border-[#2d6a4f]/20 py-8" },
    h("div", { className: "max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4" },
      h("p", { className: "text-xs text-[#3a5a3a] font-mono" }, "© 2026 Turma 2006 — Colégio Henrique Castriciano."),
      h("div", { className: "flex items-center gap-6 text-xs font-mono" },
        h("button", { onClick: () => navigateTo("/termos"), className: "text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors" }, "Termos"),
        h("button", { onClick: () => navigateTo("/privacidade"), className: "text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors" }, "Privacidade"),
      ),
    ),
  );
}

function ConnectedHome() {
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([]);
  const [content, setContent] = useState<HomePageContent>(HOME_PAGE_CONTENT_DEFAULTS);

  useEffect(() => {
    let active = true;
    async function loadHomeData() {
      const [eventData, ticketsData, contentData] = await Promise.all([
        getEventSettings().catch(() => null),
        getTicketTypes(DEFAULT_EVENT_ID).catch(() => []),
        getHomePageContent(DEFAULT_EVENT_ID).catch(() => HOME_PAGE_CONTENT_DEFAULTS),
      ]);
      if (!active) return;
      setEvent(eventData);
      setTicketTypes(ticketsData);
      setContent(contentData);
    }
    loadHomeData();
    return () => { active = false; };
  }, []);

  return h("div", { className: "min-h-screen bg-[#0d1a0f] text-foreground", style: { fontFamily: "'DM Sans', system-ui, sans-serif" } },
    h(Header, { content }),
    h("main", null,
      h(Hero, { content, event }),
      h(AboutSection, { content }),
      h(EventInfoSection, { content, event }),
      h(TicketsPreview, { content, ticketTypes }),
    ),
    h(Footer),
  );
}

export default function App() {
  const pathname = usePathname();
  if (pathname === "/") return h(ConnectedHome);
  return h(OriginalApp, { key: pathname });
}
