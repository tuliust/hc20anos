import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import {
  createSecureCheckout,
  getCheckoutStatus,
  type CheckoutCreateInput,
  type CheckoutParticipantInput,
} from "../lib/checkout";
import {
  formatCatalogPrice,
  getCurrentTicketCatalog,
  isCatalogItemAvailable,
  type CurrentTicketCatalogItem,
} from "../lib/currentTicketCatalog";
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

type ProductCode = "simple" | "family_full" | "external_guest";
type ParticipantDraft = CheckoutParticipantInput;

type StoredSelection = {
  selectedAt?: number;
  productCode?: string | null;
  ticketTypeId?: string | null;
};

const SELECTION_KEY = "hc-checkout-ticket-selected";
const PRIMARY_PRODUCT_CODES: ProductCode[] = ["simple", "family_full", "external_guest"];
const EVENT_DATE = new Date("2026-10-24T12:00:00-03:00");

const PRODUCT_LABELS: Record<ProductCode, string> = {
  simple: "Individual",
  family_full: "Família",
  external_guest: "Convidado",
};

const PRODUCT_RULES: Record<ProductCode, string> = {
  simple: "Exclusivo para o ex-aluno pré-cadastrado e vinculado à conta.",
  family_full: "Inclui o ex-aluno pré-cadastrado, um cônjuge e seus filhos.",
  external_guest: "Ingresso individual para participante adulto que não é ex-aluno.",
};

function key(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
}

function inputClass() {
  return "w-full border border-[#2d6a4f]/35 bg-[#0d1a0f] px-4 py-3 text-[#f0ebe0] outline-none focus:border-[#c9a84c] read-only:cursor-default read-only:opacity-80";
}

function readStoredSelection(): StoredSelection | null {
  try {
    const raw = window.sessionStorage.getItem(SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSelection;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeProductCode(value?: string | null): ProductCode | null {
  if (PRIMARY_PRODUCT_CODES.includes(value as ProductCode)) return value as ProductCode;
  if (value === "family_single_parent") return "family_full";
  return null;
}

function productFromTicket(ticket?: DbTicketType | null): ProductCode {
  const explicit = normalizeProductCode(String((ticket as DbTicketType & { product_code?: string | null } | null)?.product_code ?? ""));
  if (explicit) return explicit;
  const name = String(ticket?.name ?? "").toLocaleLowerCase("pt-BR");
  if (name.includes("convidado")) return "external_guest";
  if (name.includes("família") || name.includes("familia") || name.includes("casal")) return "family_full";
  return "simple";
}

function alumniParticipant(auth: AuthState): ParticipantDraft {
  return {
    client_key: key("alumni"),
    participant_type: "alumni",
    full_name: auth.name || "",
    email: auth.email || "",
    user_id: auth.userId || null,
  };
}

function childParticipant(): ParticipantDraft {
  return {
    client_key: key("child"),
    participant_type: "child",
    full_name: "",
    birth_date: "",
  };
}

function guestParticipant(auth: AuthState): ParticipantDraft {
  return {
    client_key: key("guest"),
    participant_type: "external_guest",
    full_name: auth.name || "",
    email: auth.email || "",
    phone: "",
    birth_date: "",
    user_id: auth.userId || null,
  };
}

function defaultParticipants(product: ProductCode, auth: AuthState): ParticipantDraft[] {
  if (product === "external_guest") return [guestParticipant(auth)];
  const alumni = alumniParticipant(auth);
  if (product === "simple") return [alumni];
  return [
    alumni,
    { client_key: key("spouse"), participant_type: "spouse", full_name: "", email: "" },
    childParticipant(),
  ];
}

function ageOnEventDate(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00-03:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = EVENT_DATE.getFullYear() - birth.getFullYear();
  const eventMonth = EVENT_DATE.getMonth();
  const birthMonth = birth.getMonth();
  if (eventMonth < birthMonth || (eventMonth === birthMonth && EVENT_DATE.getDate() < birth.getDate())) age -= 1;
  return age;
}

function participantLabel(participant: ParticipantDraft) {
  if (participant.participant_type === "alumni") return "Ex-aluno";
  if (participant.participant_type === "spouse") return "Cônjuge";
  if (participant.participant_type === "external_guest") return "Convidado adulto";
  return "Filho(a)";
}

export function SecureCheckoutPage({ navigate, auth, ticketTypes, selectedTicketTypeId, checkoutReturn }: Props) {
  const storedSelection = useMemo(readStoredSelection, []);
  const fallbackTicket = useMemo(
    () => ticketTypes.find((item) => item.id === selectedTicketTypeId)
      ?? ticketTypes.find((item) => item.id === storedSelection?.ticketTypeId)
      ?? ticketTypes.find((item) => item.status === "open")
      ?? null,
    [selectedTicketTypeId, storedSelection?.ticketTypeId, ticketTypes],
  );
  const initialProduct = normalizeProductCode(storedSelection?.productCode) ?? productFromTicket(fallbackTicket);
  const hasTicketSelection = Boolean(selectedTicketTypeId || storedSelection?.ticketTypeId || storedSelection?.productCode);

  const [productCode, setProductCode] = useState<ProductCode>(initialProduct);
  const [buyer, setBuyer] = useState({ name: auth.name || "", email: auth.email || "", phone: "" });
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() => defaultParticipants(initialProduct, auth));
  const [catalog, setCatalog] = useState<CurrentTicketCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(!checkoutReturn);
  const [catalogError, setCatalogError] = useState("");
  const [profilePersonId, setProfilePersonId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(auth.userId));
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!checkoutReturn && !hasTicketSelection) window.location.replace("/ingressos");
  }, [checkoutReturn, hasTicketSelection]);

  useEffect(() => {
    if (checkoutReturn) return;
    let active = true;
    setCatalogLoading(true);
    getCurrentTicketCatalog()
      .then((rows) => {
        if (!active) return;
        setCatalog(rows);
        const selectedId = selectedTicketTypeId ?? storedSelection?.ticketTypeId ?? null;
        const selected = rows.find((item) => item.ticket_type_id === selectedId)
          ?? rows.find((item) => item.product_code === normalizeProductCode(storedSelection?.productCode));
        if (selected) {
          setProductCode(selected.product_code);
          setParticipants(defaultParticipants(selected.product_code, auth));
        }
        setCatalogError(rows.length ? "" : "Nenhum ingresso está disponível no lote vigente.");
      })
      .catch((cause) => {
        if (!active) return;
        setCatalogError(cause instanceof Error ? cause.message : "Não foi possível carregar os valores do lote vigente.");
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [auth, checkoutReturn, selectedTicketTypeId, storedSelection?.productCode, storedSelection?.ticketTypeId]);

  useEffect(() => {
    if (!auth.userId) {
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    (supabase as any)
      .from("profiles")
      .select("display_name,contact_email,contact_whatsapp,person_id,people(full_name)")
      .eq("user_id", auth.userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active) return;
        const name = data?.display_name || data?.people?.full_name || auth.name || "";
        const email = data?.contact_email || auth.email || "";
        setProfilePersonId(data?.person_id || null);
        setBuyer((current) => ({
          ...current,
          name: current.name || name,
          email: current.email || email,
          phone: current.phone || data?.contact_whatsapp || "",
        }));
        setParticipants((current) => current.map((participant) => participant.participant_type === "alumni" ? {
          ...participant,
          full_name: name,
          email,
          person_id: data?.person_id || null,
          user_id: auth.userId,
        } : participant));
      })
      .finally(() => { if (active) setProfileLoading(false); });
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

  const catalogByCode = useMemo(
    () => new Map(catalog.map((item) => [item.product_code, item])),
    [catalog],
  );
  const currentProduct = catalogByCode.get(productCode) ?? null;
  const estimatedTotal = currentProduct?.price_cents ?? 0;

  function updateParticipant(clientKey: string, patch: Partial<ParticipantDraft>) {
    setParticipants((current) => current.map((item) => item.client_key === clientKey ? { ...item, ...patch } : item));
  }

  function addChild() {
    if (productCode !== "family_full" || participants.length >= 6) return;
    setParticipants((current) => [...current, childParticipant()]);
    setError("");
  }

  function canRemoveParticipant(participant: ParticipantDraft) {
    return participant.participant_type === "child"
      && participants.filter((item) => item.participant_type === "child").length > 1;
  }

  function removeParticipant(clientKey: string) {
    setParticipants((current) => current.filter((item) => item.client_key !== clientKey));
  }

  function validate() {
    if (!currentProduct || !isCatalogItemAvailable(currentProduct)) return "O ingresso selecionado não está disponível no lote vigente.";
    if (!buyer.name.trim() || !buyer.email.trim() || !buyer.phone.trim()) return "Preencha nome, e-mail e WhatsApp do comprador.";
    if (!/^\S+@\S+\.\S+$/.test(buyer.email)) return "Informe um e-mail válido.";
    if (participants.length < 1 || participants.length > 6) return "O pedido deve ter entre 1 e 6 participantes.";

    const alumni = participants.filter((item) => item.participant_type === "alumni");
    const spouses = participants.filter((item) => item.participant_type === "spouse");
    const children = participants.filter((item) => item.participant_type === "child");
    const guests = participants.filter((item) => item.participant_type === "external_guest");

    if ((productCode === "simple" || productCode === "family_full") && profileLoading) return "Aguarde a validação do cadastro do ex-aluno.";
    if ((productCode === "simple" || productCode === "family_full") && !profilePersonId) {
      return "Este ingresso é exclusivo para ex-aluno pré-cadastrado e vinculado à conta.";
    }
    if (productCode === "simple" && (alumni.length !== 1 || spouses.length || children.length || guests.length)) {
      return "O ingresso Individual deve conter somente o ex-aluno pré-cadastrado.";
    }
    if (productCode === "family_full" && (alumni.length !== 1 || spouses.length !== 1 || children.length < 1 || guests.length)) {
      return "O ingresso Família exige um ex-aluno pré-cadastrado, um cônjuge e pelo menos um filho.";
    }
    if (productCode === "external_guest" && (guests.length !== 1 || alumni.length || spouses.length || children.length)) {
      return "O ingresso Convidado deve conter somente um participante adulto.";
    }

    for (const participant of participants) {
      if (!participant.full_name.trim()) return "Informe o nome completo de todos os participantes.";
      if (participant.participant_type === "child" && !participant.birth_date) return "Informe a data de nascimento de cada filho.";
      if (participant.participant_type === "external_guest") {
        if (!participant.email?.trim() || !participant.phone?.trim() || !participant.birth_date) {
          return "Informe nome, e-mail, WhatsApp e data de nascimento do convidado.";
        }
        if (!/^\S+@\S+\.\S+$/.test(participant.email)) return "Informe um e-mail válido para o convidado.";
        const age = ageOnEventDate(participant.birth_date);
        if (age === null || age < 18) return "O ingresso Convidado é exclusivo para participantes com 18 anos ou mais na data do evento.";
      }
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
      const cleanParticipants: CheckoutParticipantInput[] = participants.map((participant) => ({
        ...participant,
        full_name: participant.full_name.trim(),
        email: participant.email?.trim().toLowerCase() || null,
        phone: participant.phone?.trim() || null,
        birth_date: participant.birth_date || null,
      }));
      const payload: CheckoutCreateInput = {
        buyer_name: buyer.name.trim(),
        buyer_email: buyer.email.trim().toLowerCase(),
        buyer_phone: buyer.phone.trim(),
        product_code: productCode,
        participants: cleanParticipants,
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

  if (!hasTicketSelection) return null;

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <button onClick={() => navigate("tickets")} className="mb-8 flex items-center gap-2 text-sm text-[#7a9a7a]"><ArrowLeft size={16} /> Voltar aos ingressos</button>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Checkout seguro</p>
        <h1 className="mt-2 font-['Playfair_Display'] text-5xl font-bold text-[#f0ebe0]">Participantes e pagamento</h1>
        <p className="mt-3 text-[#8ab89a]">A reserva dura 30 minutos. O valor final é calculado no servidor conforme o lote vigente.</p>

        <section className="mt-8 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">Ingresso selecionado</p>
          {catalogLoading ? <p className="mt-4 flex items-center gap-2 text-sm text-[#8ab89a]"><RefreshCw size={16} className="animate-spin" />Carregando lote e valores...</p> : currentProduct ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-2xl font-semibold text-[#f0ebe0]">{PRODUCT_LABELS[productCode]}</h2><p className="mt-1 text-sm text-[#8ab89a]">{currentProduct.lot_name}</p><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7a9a7a]">{currentProduct.description || PRODUCT_RULES[productCode]}</p></div>
              <p className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">{formatCatalogPrice(currentProduct.price_cents)}</p>
            </div>
          ) : <p className="mt-4 text-sm text-[#e74c3c]">{catalogError || "Ingresso indisponível."}</p>}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <h2 className="text-xl font-semibold text-[#f0ebe0]">Dados do comprador</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><input className={inputClass()} placeholder="Nome completo" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} /><input className={inputClass()} placeholder="E-mail" type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} /><input className={`${inputClass()} md:col-span-2`} placeholder="WhatsApp" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} /></div>
        </section>

        {productCode === "family_full" && (
          <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-[#f0ebe0]">Composição da família</h2><p className="mt-2 text-sm text-[#8ab89a]">O valor do ingresso inclui o ex-aluno, um cônjuge e todos os filhos adicionados, respeitando o limite de seis participantes por pedido.</p></div><button type="button" onClick={addChild} disabled={participants.length >= 6} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#c9a84c]/50 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] disabled:opacity-40"><Plus size={15} />Adicionar filho(a)</button></div>
          </section>
        )}

        <section className="mt-6 space-y-4">
          {participants.map((participant, index) => (
            <div key={participant.client_key} className="border border-[#2d6a4f]/30 bg-[#141f14] p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-wider text-[#c9a84c]">Participante {index + 1}</p><h3 className="mt-1 text-lg font-semibold text-[#f0ebe0]">{participantLabel(participant)}</h3><p className="mt-1 text-xs text-[#8ab89a]">Incluído no ingresso selecionado</p></div>{canRemoveParticipant(participant) && <button type="button" aria-label={`Remover ${participantLabel(participant)}`} onClick={() => removeParticipant(participant.client_key)} className="text-[#e74c3c]"><Trash2 size={18} /></button>}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input className={inputClass()} placeholder="Nome completo" readOnly={participant.participant_type === "alumni"} value={participant.full_name} onChange={(event) => updateParticipant(participant.client_key, { full_name: event.target.value })} />
                {participant.participant_type === "child" ? <input className={inputClass()} aria-label="Data de nascimento do filho" type="date" value={participant.birth_date ?? ""} onChange={(event) => updateParticipant(participant.client_key, { birth_date: event.target.value })} /> : <input className={inputClass()} placeholder="E-mail do participante" type="email" readOnly={participant.participant_type === "alumni"} value={participant.email ?? ""} onChange={(event) => updateParticipant(participant.client_key, { email: event.target.value })} />}
                {participant.participant_type === "external_guest" && <><input className={inputClass()} placeholder="WhatsApp do convidado" value={participant.phone ?? ""} onChange={(event) => updateParticipant(participant.client_key, { phone: event.target.value })} /><label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">Data de nascimento</span><input className={inputClass()} type="date" value={participant.birth_date ?? ""} onChange={(event) => updateParticipant(participant.client_key, { birth_date: event.target.value })} /></label></>}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a9a7a]">Resumo estimado</p><p className="mt-2 text-sm text-[#8ab89a]">{participants.length} participante(s). O servidor confirmará a composição e o total antes de criar o pagamento.</p></div><p className="font-['Playfair_Display'] text-3xl font-bold text-[#c9a84c]">{formatCatalogPrice(estimatedTotal)}</p></div>
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6"><label className="flex items-start gap-3 text-sm text-[#8ab89a]"><input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1" /><span>Li e aceito os Termos de Uso, a Política de Privacidade e as regras de reembolso e transferência.</span></label>{(error || catalogError) && <p className="mt-4 border border-[#c0392b]/50 bg-[#2e0a0a] p-3 text-sm text-[#f0ebe0]">{error || catalogError}</p>}<button disabled={busy || catalogLoading || profileLoading || !currentProduct} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#2d6a4f] px-6 py-4 font-bold text-white disabled:opacity-50">{busy ? <><RefreshCw size={18} className="animate-spin" />Preparando pagamento...</> : <><Shield size={18} />Ir para o Mercado Pago</>}</button><p className="mt-3 text-center text-xs text-[#7a9a7a]">Pix ou cartão de crédito em até 3 parcelas. Boleto não disponível.</p></section>
      </div>
    </div>
  );
}
