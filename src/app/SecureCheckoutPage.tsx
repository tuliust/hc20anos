import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import { createSecureCheckout, getCheckoutStatus, type CheckoutCreateInput, type CheckoutExtraInput, type CheckoutParticipantInput } from "../lib/checkout";
import { supabase } from "../lib/supabase";
import type { DbTicketType, PaymentStatus } from "../lib/database.types";

 type AuthState = {
  loggedIn: boolean;
  name: string;
  userId: string;
  email?: string;
};

type CheckoutReturnState = { status: PaymentStatus | "cancelled"; publicToken: string } | null;

type Props = {
  navigate: (page: any) => void;
  auth: AuthState;
  ticketTypes: DbTicketType[];
  selectedTicketTypeId: string | null;
  checkoutReturn: CheckoutReturnState;
};

type ProductCode = "simple" | "family_full" | "family_single_parent" | "external_guest";
type ParticipantDraft = CheckoutParticipantInput & { drinks: number; barbecue: number };

const PRODUCT_LABELS: Record<ProductCode, string> = {
  simple: "Ingresso Ex-Aluno",
  family_full: "Família completa",
  family_single_parent: "Família sem cônjuge",
  external_guest: "Ingresso Convidado",
};

function key(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
}

function inputClass() {
  return "w-full border border-[#2d6a4f]/35 bg-[#0d1a0f] px-4 py-3 text-[#f0ebe0] outline-none focus:border-[#c9a84c]";
}

function productFromTicket(ticket?: DbTicketType | null): ProductCode {
  const code = String((ticket as any)?.product_code ?? "");
  if (["family_full", "family_single_parent", "simple", "external_guest"].includes(code)) return code as ProductCode;
  const name = String(ticket?.name ?? "").toLowerCase();
  if (name.includes("convidado")) return "external_guest";
  if (name.includes("família") && (name.includes("sem cônjuge") || name.includes("monoparental"))) return "family_single_parent";
  if (name.includes("família") || name.includes("casal")) return "family_full";
  return "simple";
}

function defaultParticipants(product: ProductCode, auth: AuthState): ParticipantDraft[] {
  if (product === "external_guest") {
    return [{
      client_key: key("guest"),
      participant_type: "external_guest",
      full_name: auth.name || "",
      email: auth.email || "",
      user_id: auth.userId || null,
      drinks: 0,
      barbecue: 0,
    }];
  }

  const alumni: ParticipantDraft = {
    client_key: key("alumni"),
    participant_type: "alumni",
    full_name: auth.name || "",
    email: auth.email || "",
    user_id: auth.userId || null,
    drinks: 0,
    barbecue: 0,
  };
  if (product === "simple") return [alumni];
  const child: ParticipantDraft = {
    client_key: key("child"),
    participant_type: "child",
    full_name: "",
    birth_date: "",
    drinks: 0,
    barbecue: 0,
  };
  if (product === "family_single_parent") return [alumni, child];
  return [
    alumni,
    { client_key: key("spouse"), participant_type: "spouse", full_name: "", drinks: 0, barbecue: 0 },
    child,
  ];
}

function isFamilyProduct(product: ProductCode) {
  return product === "family_full" || product === "family_single_parent";
}

export function SecureCheckoutPage({ navigate, auth, ticketTypes, selectedTicketTypeId, checkoutReturn }: Props) {
  const selectableTicketTypes = useMemo(
    () => ticketTypes.filter((item) => ["simple", "family_full", "family_single_parent", "external_guest"].includes(String((item as any).product_code ?? ""))),
    [ticketTypes],
  );
  const selectedTicket = useMemo(
    () => selectableTicketTypes.find((item) => item.id === selectedTicketTypeId) ?? selectableTicketTypes.find((item) => item.status === "open") ?? null,
    [selectedTicketTypeId, selectableTicketTypes],
  );
  const initialProduct = productFromTicket(selectedTicket);
  const [productCode, setProductCode] = useState<ProductCode>(initialProduct);
  const [buyer, setBuyer] = useState({ name: auth.name || "", email: auth.email || "", phone: "" });
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() => defaultParticipants(initialProduct, auth));
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!auth.userId) return;
    let active = true;
    (supabase as any).from("profiles").select("display_name,contact_email,contact_whatsapp,person_id,people(full_name)").eq("user_id", auth.userId).maybeSingle()
      .then(({ data }: any) => {
        if (!active || !data) return;
        const name = data.display_name || data.people?.full_name || auth.name || "";
        const email = data.contact_email || auth.email || "";
        setBuyer((current) => ({ ...current, name: current.name || name, email: current.email || email, phone: current.phone || data.contact_whatsapp || "" }));
        setParticipants((current) => current.map((participant) => participant.participant_type === "alumni" || participant.participant_type === "external_guest" ? {
          ...participant,
          full_name: participant.full_name || name,
          email: participant.email || email,
          person_id: participant.person_id || data.person_id || null,
          user_id: auth.userId,
        } : participant));
      });
    return () => { active = false; };
  }, [auth.email, auth.name, auth.userId]);

  useEffect(() => {
    if (!checkoutReturn?.publicToken) return;
    let active = true;
    setBusy(true);
    getCheckoutStatus(checkoutReturn.publicToken)
      .then((data) => { if (active) setStatus(data ?? { payment_status: checkoutReturn.status }); })
      .catch(() => { if (active) setStatus({ payment_status: checkoutReturn.status }); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [checkoutReturn]);

  function changeProduct(next: ProductCode) {
    setProductCode(next);
    setParticipants(defaultParticipants(next, auth));
    setError("");
  }

  function updateParticipant(clientKey: string, patch: Partial<ParticipantDraft>) {
    setParticipants((current) => current.map((item) => item.client_key === clientKey ? { ...item, ...patch } : item));
  }

  function addChild() {
    if (!isFamilyProduct(productCode) || participants.length >= 6) return;
    setParticipants((current) => [...current, {
      client_key: key("child"), participant_type: "child", full_name: "", birth_date: "", drinks: 0, barbecue: 0,
    }]);
  }

  function removeParticipant(clientKey: string) {
    setParticipants((current) => current.filter((item) => item.client_key !== clientKey));
  }

  function validate() {
    if (!buyer.name.trim() || !buyer.email.trim() || !buyer.phone.trim()) return "Preencha nome, e-mail e WhatsApp do comprador.";
    if (!/^\S+@\S+\.\S+$/.test(buyer.email)) return "Informe um e-mail válido.";
    if (participants.length < 1 || participants.length > 6) return "O pedido deve ter entre 1 e 6 participantes.";
    for (const participant of participants) {
      if (!participant.full_name.trim()) return "Informe o nome completo de todos os participantes.";
      if (participant.participant_type === "child" && !participant.birth_date) return "Informe a data de nascimento de cada filho.";
    }
    if (!acceptTerms) return "Aceite os Termos de Uso e a Política de Privacidade.";
    return "";
  }

  async function submit() {
    const validation = validate();
    if (validation) { setError(validation); return; }
    setBusy(true);
    setError("");
    try {
      const cleanParticipants: CheckoutParticipantInput[] = participants.map(({ drinks: _d, barbecue: _b, ...participant }) => ({
        ...participant,
        full_name: participant.full_name.trim(),
        email: participant.email?.trim().toLowerCase() || null,
        phone: participant.phone?.trim() || null,
        birth_date: participant.birth_date || null,
      }));
      const extras: CheckoutExtraInput[] = participants.flatMap((participant) => [
        ...(participant.drinks > 0 ? [{ participant_key: participant.client_key, extra_type: "drinks" as const, quantity: participant.drinks }] : []),
        ...(participant.barbecue > 0 ? [{ participant_key: participant.client_key, extra_type: "barbecue" as const, quantity: participant.barbecue }] : []),
      ]);
      const payload: CheckoutCreateInput = {
        buyer_name: buyer.name.trim(),
        buyer_email: buyer.email.trim().toLowerCase(),
        buyer_phone: buyer.phone.trim(),
        product_code: productCode,
        participants: cleanParticipants,
        extras,
      };
      const result = await createSecureCheckout(payload);
      window.location.assign(result.checkout_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setBusy(false);
    }
  }

  if (checkoutReturn?.publicToken) {
    const paymentStatus = status?.payment_status ?? checkoutReturn.status;
    const approved = paymentStatus === "approved";
    return (
      <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className={`border p-8 ${approved ? "border-[#2d6a4f] bg-[#0d2e1a]" : "border-[#c9a84c]/40 bg-[#1a1a0a]"}`}>
            {busy ? <RefreshCw className="mb-4 animate-spin text-[#c9a84c]" /> : approved ? <Check className="mb-4 text-[#c9a84c]" /> : <Clock className="mb-4 text-[#c9a84c]" />}
            <h1 className="font-['Playfair_Display'] text-4xl font-bold text-[#f0ebe0]">{approved ? "Pagamento aprovado" : "Status do pagamento"}</h1>
            <p className="mt-3 text-[#8ab89a]">Status atual: <strong className="text-[#f0ebe0]">{paymentStatus}</strong>.</p>
            <div className="mt-8 flex gap-3"><button className="bg-[#2d6a4f] px-5 py-3 font-semibold text-white" onClick={() => navigate("my-ticket")}>Ver meus ingressos</button><button className="border border-[#2d6a4f]/40 px-5 py-3 text-[#f0ebe0]" onClick={() => navigate("home")}>Voltar ao site</button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <button onClick={() => navigate("tickets")} className="mb-8 flex items-center gap-2 text-sm text-[#7a9a7a]"><ArrowLeft size={16} /> Voltar aos ingressos</button>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Checkout seguro</p>
        <h1 className="mt-2 font-['Playfair_Display'] text-5xl font-bold text-[#f0ebe0]">Participantes e pagamento</h1>
        <p className="mt-3 text-[#8ab89a]">A reserva dura 30 minutos. O valor final é calculado no servidor conforme o lote vigente.</p>

        <section className="mt-8 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <h2 className="text-xl font-semibold text-[#f0ebe0]">Categoria</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{(Object.keys(PRODUCT_LABELS) as ProductCode[]).map((code) => <button key={code} onClick={() => changeProduct(code)} className={`border p-4 text-left ${productCode === code ? "border-[#c9a84c] bg-[#1a2e1a] text-[#f0ebe0]" : "border-[#2d6a4f]/30 text-[#8ab89a]"}`}><strong>{PRODUCT_LABELS[code]}</strong></button>)}</div>
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <h2 className="text-xl font-semibold text-[#f0ebe0]">Dados do comprador</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><input className={inputClass()} placeholder="Nome completo" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} /><input className={inputClass()} placeholder="E-mail" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} /><input className={`${inputClass()} md:col-span-2`} placeholder="WhatsApp" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} /></div>
        </section>

        <section className="mt-6 space-y-4">
          {participants.map((participant, index) => <div key={participant.client_key} className="border border-[#2d6a4f]/30 bg-[#141f14] p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-xs uppercase tracking-wider text-[#c9a84c]">Participante {index + 1}</p><h3 className="mt-1 text-lg font-semibold text-[#f0ebe0]">{participant.participant_type === "alumni" ? "Ex-aluno" : participant.participant_type === "spouse" ? "Cônjuge" : participant.participant_type === "external_guest" ? "Convidado" : "Filho(a)"}</h3></div>{participant.participant_type === "child" && participants.filter((item) => item.participant_type === "child").length > 1 && <button onClick={() => removeParticipant(participant.client_key)} className="text-[#c0392b]"><Trash2 size={18} /></button>}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><input className={inputClass()} placeholder="Nome completo" value={participant.full_name} onChange={(e) => updateParticipant(participant.client_key, { full_name: e.target.value })} />{participant.participant_type === "child" ? <input className={inputClass()} type="date" value={participant.birth_date ?? ""} onChange={(e) => updateParticipant(participant.client_key, { birth_date: e.target.value })} /> : <input className={inputClass()} placeholder="E-mail do participante (opcional)" value={participant.email ?? ""} onChange={(e) => updateParticipant(participant.client_key, { email: e.target.value })} />}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm text-[#8ab89a]">Pacotes de bebidas<input className={`${inputClass()} mt-2`} type="number" min="0" value={participant.drinks} onChange={(e) => updateParticipant(participant.client_key, { drinks: Math.max(0, Number(e.target.value) || 0) })} /></label><label className="text-sm text-[#8ab89a]">Pacotes de churrasco<input className={`${inputClass()} mt-2`} type="number" min="0" value={participant.barbecue} onChange={(e) => updateParticipant(participant.client_key, { barbecue: Math.max(0, Number(e.target.value) || 0) })} /></label></div></div>)}
          {isFamilyProduct(productCode) && participants.length < 6 && <button onClick={addChild} className="flex items-center gap-2 border border-[#2d6a4f]/40 px-4 py-3 text-[#f0ebe0]"><Plus size={16} />Adicionar filho(a)</button>}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6"><label className="flex items-start gap-3 text-sm text-[#8ab89a]"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" /><span>Li e aceito os Termos de Uso, a Política de Privacidade e as regras de reembolso e transferência.</span></label>{error && <p className="mt-4 border border-[#c0392b]/50 bg-[#2e0a0a] p-3 text-sm text-[#f0ebe0]">{error}</p>}<button disabled={busy} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#2d6a4f] px-6 py-4 font-bold text-white disabled:opacity-50">{busy ? <><RefreshCw size={18} className="animate-spin" />Preparando pagamento...</> : <><Shield size={18} />Ir para o Mercado Pago</>}</button><p className="mt-3 text-center text-xs text-[#7a9a7a]">Pix ou cartão de crédito em até 3 parcelas. Boleto não disponível.</p></section>
      </div>
    </div>
  );
}
