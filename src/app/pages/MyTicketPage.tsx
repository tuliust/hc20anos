import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { getMyTickets } from "../../lib/services";
import type { TicketWithDetails } from "../../lib/commerce.types";
import type { AuthState, Page } from "../app.types";
import { formatDateTimeBR, ticketPaymentStatus, ticketTypeName } from "../appFormatters";
import { Btn, DisplayTitle, EmptyState, ErrorState, InfoRow, LoadingState, SectionLabel, StatusBadge } from "../components/AppPrimitives";

export function MyTicketPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const ticketData = await getMyTickets(auth.userId, auth.email);
      setTickets(ticketData);
      if (!selectedId && ticketData[0]) setSelectedId(ticketData[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar seus ingressos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTicket(); }, [auth.userId, auth.email]);

  const ticket = tickets.find(item => item.id === selectedId) ?? tickets[0] ?? null;
  const paymentStatus = ticketPaymentStatus(ticket);
  const refundTitle = paymentStatus === "refunded"
    ? "Reembolso concluído"
    : paymentStatus === "approved"
      ? "Reembolso integral em processamento"
      : "Pagamento sem cobrança adicional";
  const refundBody = paymentStatus === "refunded"
    ? "O Mercado Pago confirmou o reembolso deste pagamento. O prazo para o valor aparecer na conta ou na fatura depende da instituição financeira e do meio de pagamento."
    : paymentStatus === "approved"
      ? "O evento foi cancelado e a organização está processando a devolução integral do valor pago pelo Mercado Pago. Você não precisa solicitar o reembolso."
      : "O evento foi cancelado e não haverá novas cobranças. Se você acredita que houve um pagamento não identificado, entre em contato com a organização.";

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("alumni-area")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} />Minha área</button>

        <SectionLabel>Pagamento e reembolso</SectionLabel>
        <DisplayTitle className="text-4xl md:text-6xl mb-4">Meus ingressos</DisplayTitle>
        <p className="text-[#8ab89a] text-sm md:text-base max-w-2xl mb-8">O encontro de 2026 foi cancelado. Esta área permanece disponível para você consultar o ingresso, o pagamento original e o andamento do reembolso.</p>

        <div className="mb-8 border border-[#c9a84c]/35 bg-[#141f14] p-5 md:p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c]">Evento cancelado</p>
          <p className="mt-2 text-sm leading-6 text-[#d8ddd8]">Todos os pagamentos aprovados serão devolvidos integralmente pela organização.</p>
          <button type="button" onClick={() => window.location.assign("/meus-pedidos")} className="mt-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] hover:text-[#f0ebe0]">Ver meus pedidos e pagamentos →</button>
        </div>

        {loading && <LoadingState message="Carregando ingressos..." />}
        {error && <ErrorState message={error} onRetry={loadTicket} />}

        {!loading && !error && tickets.length === 0 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
            <EmptyState title="Nenhum ingresso encontrado" subtitle="Não localizamos pagamentos ou ingressos vinculados ao seu e-mail de login." />
            <div className="mt-6 flex justify-center"><Btn variant="outline" onClick={() => window.location.assign("/meus-pedidos")}><FileText size={16} />Consultar meus pedidos</Btn></div>
          </div>
        )}

        {!loading && !error && ticket && (
          <div className="flex flex-col gap-6">
            {tickets.length > 1 && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-3">Selecionar ingresso</p>
                <div className="flex flex-wrap gap-2">
                  {tickets.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`px-4 py-2 text-xs font-mono border ${item.id === ticket.id ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a]"}`}>{item.attendee_name}</button>)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
              <div className="bg-[#141f14] border border-[#c9a84c]/35 p-6">
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">Situação</p>
                <h2 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">{refundTitle}</h2>
                <p className="mt-4 text-[#8ab89a] text-sm leading-6">{refundBody}</p>
                <div className="mt-5 flex flex-wrap gap-2"><StatusBadge status={paymentStatus} /><StatusBadge status="cancelled" /></div>
              </div>

              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-4">Dados do ingresso e do pagamento</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <InfoRow label="Participante" value={ticket.attendee_name} />
                  <InfoRow label="Tipo" value={ticketTypeName(ticket)} />
                  <InfoRow label="Pagamento" value={paymentStatus === "refunded" ? "Reembolsado" : paymentStatus === "approved" ? "Aprovado — aguardando devolução" : paymentStatus} />
                  <InfoRow label="Método" value={ticket.orders?.payment_method ?? "Não informado"} />
                  <InfoRow label="Data do pagamento" value={formatDateTimeBR(ticket.orders?.paid_at) || "Sem confirmação"} />
                  <InfoRow label="Pedido" value={ticket.order_id} />
                </div>
              </div>
            </div>

            <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-6">
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">Sobre o QR Code</p>
              <p className="text-[#8ab89a] text-sm leading-6">O ingresso permanece registrado como comprovante histórico da compra, mas não haverá check-in nem uso do QR Code porque o evento foi cancelado.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
