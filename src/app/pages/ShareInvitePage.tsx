import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, FileText, Phone, Send, Ticket } from "lucide-react";
import { getEventSettings, getMyTickets } from "../../lib/services";
import type { TicketWithDetails } from "../../lib/commerce.types";
import type { DbEvent } from "../../lib/content.types";
import type { AuthState, Page } from "../app.types";
import { eventDateTimeLabel, ticketPaymentStatus } from "../appFormatters";
import { Btn, DisplayTitle, LoadingState, SectionLabel, StatusBadge } from "../components/AppPrimitives";

export function ShareInvitePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [useName, setUseName] = useState(true);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadInviteData() {
      setLoading(true);
      try {
        const [eventData, ticketData] = await Promise.all([
          getEventSettings().catch(() => null),
          auth.loggedIn ? getMyTickets(auth.userId, auth.email).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        setEvent(eventData);
        setTickets(ticketData);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInviteData();
    return () => { active = false; };
  }, [auth.loggedIn, auth.userId, auth.email]);

  const hasApprovedTicket = tickets.some(ticket => ticketPaymentStatus(ticket) === "approved");
  const dateLabel = eventDateTimeLabel(event);
  const locationLabel = event?.location_name ?? "Natal, Rio Grande do Norte";
  const inviteText = `${useName && auth.loggedIn ? auth.name + " vai ao" : "Eu vou ao"} reencontro da Turma 2006 do Colégio Henrique Castriciano — 20 anos depois. ${dateLabel}, em ${locationLabel}. Vamos juntos?`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setMessage("Texto copiado.");
    } catch {
      setMessage("Copie manualmente o texto do convite.");
    }
  }

  async function nativeShare() {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ title: "Reencontro Turma 2006", text: inviteText });
    } else {
      window.open(whatsappUrl, "_blank");
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate(auth.loggedIn ? "alumni-area" : "home")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar</button>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 items-start">
          <div>
            <SectionLabel>Convite compartilhável</SectionLabel>
            <DisplayTitle className="text-4xl md:text-6xl mb-4">Chame a turma para o reencontro</DisplayTitle>
            <p className="text-[#7a9a7a] leading-relaxed mb-6">Use este cartão para divulgar o reencontro. A versão sem nome preserva sua privacidade.</p>
            {loading && <LoadingState message="Carregando dados do convite..." />}
            {!loading && auth.loggedIn && (
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusBadge status={hasApprovedTicket ? "approved" : "pending"} />
                <span className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">{hasApprovedTicket ? "Ingresso aprovado" : "Ingresso não localizado/aprovado"}</span>
              </div>
            )}
            <label className="flex items-center gap-3 bg-[#141f14] border border-[#2d6a4f]/30 p-4 mb-4 cursor-pointer">
              <input type="checkbox" checked={useName} onChange={event => setUseName(event.target.checked)} className="accent-[#2d6a4f]" disabled={!auth.loggedIn} />
              <span className="text-[#f0ebe0] text-sm">Usar meu nome no convite {auth.loggedIn ? "" : "(faça login para ativar)"}</span>
            </label>
            {message && <p className="text-[#74c69d] text-sm font-mono mb-4">{message}</p>}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Btn onClick={nativeShare}><Send size={16} />Compartilhar</Btn>
              <Btn variant="outline" onClick={() => window.open(whatsappUrl, "_blank")}><Phone size={16} />WhatsApp</Btn>
              <Btn variant="ghost" onClick={copyInvite}><FileText size={16} />Copiar texto</Btn>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {auth.loggedIn && <Btn variant="ghost" onClick={() => navigate("my-ticket")}><Ticket size={16} />Meu ingresso</Btn>}
              <Btn variant="ghost" onClick={() => navigate("tickets")}><CreditCard size={16} />Comprar ingresso</Btn>
            </div>
            <p className="text-[#7a9a7a] text-xs font-mono mt-6">Compartilhamento disponivel por texto, Web Share API e WhatsApp.</p>
          </div>

          <div className="bg-[#f0ebe0] text-[#0d1a0f] p-8 shadow-2xl border-8 border-[#c9a84c]">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#2d6a4f] mb-8">Colégio Henrique Castriciano</p>
            <h3 className="font-['Playfair_Display'] text-4xl font-black leading-none mb-6">Eu vou ao reencontro da Turma 2006</h3>
            {useName && auth.loggedIn && <p className="text-[#2d6a4f] font-bold text-lg mb-6">{auth.name}</p>}
            <div className="h-px bg-[#c9a84c] my-6" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Data</p><p className="font-bold">{dateLabel.split(" · ")[0]}</p></div>
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Hora</p><p className="font-bold">{dateLabel.split(" · ")[1] ?? "19h"}</p></div>
              <div className="col-span-2"><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Local</p><p className="font-bold">{locationLabel}</p></div>
            </div>
            <p className="mt-8 text-xs leading-relaxed text-[#5b4636]">20 anos depois, a turma se reencontra para celebrar histórias, fotos antigas e vínculos que atravessaram o tempo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
