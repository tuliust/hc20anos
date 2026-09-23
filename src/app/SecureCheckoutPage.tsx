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
import type { DbTicketType, PaymentStatus } from "../lib/commerce.types";

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

type ParticipantDraft = CheckoutParticipantInput;
type StoredSelection = { selectedAt?: number; productCode?: string | null; ticketTypeId?: string | null };

const SELECTION_KEY = "hc-checkout-ticket-selected";
const EVENT_DATE = new Date("2026-09-26T14:00:00-03:00");
const ADULT_PRICE_CENTS = 12_000;
const CHILD_HALF_PRICE_CENTS = 6_000;
const MAX_PARTICIPANTS = 6;

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

function alumniParticipant(auth: AuthState): ParticipantDraft {
  return {
    client_key: key("alumni"),
    participant_type: "alumni",
    full_name: auth.name || "",
    email: auth.email || "",
    user_id: auth.userId || null,
  };
}

function spouseParticipant(): ParticipantDraft {
  return {
    client_key: key("spouse"),
    participant_type: "spouse",
    full_name: "",
    email: "",
    relationship_to_alumni: "spouse",
  };
}

function childParticipant(): ParticipantDraft {
  return {
    client_key: key("child"),
    participant_type: "child",
    full_name: "",
    birth_date: "",
    relationship_to_alumni: "child",
  };
}

function ageOnEventDate(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00-03:00`);
  if (Number.isNaN(birth.getTime()) || birth > EVENT_DATE) return null;
  let age = EVENT_DATE.getFullYear() - birth.getFullYear();
  const eventMonth = EVENT_DATE.getMonth();
  const birthMonth = birth.getMonth();
  if (eventMonth < birthMonth || (eventMonth === birthMonth && EVENT_DATE.getDate() < birth.getDate())) age -= 1;
  return age;
}

function participantPrice(participant: ParticipantDraft): number | null {
  if (participant.participant_type === "alumni" || participant.participant_type === "spouse") return ADULT_PRICE_CENTS;
  const age = ageOnEventDate(participant.birth_date);
  if (age === null) return null;
  if (age <= 8) return 0;
  if (age <= 12) return CHILD_HALF_PRICE_CENTS;
  return ADULT_PRICE_CENTS;
}

function participantLabel(participant: ParticipantDraft, index: number) {
  if (participant.participant_type === "alumni") return "Ex-aluno";
  if (participant.participant_type === "spouse") return "Cônjuge";
  return `Filho(a) ${index + 1}`;
}

export function SecureCheckoutPage({ navigate, auth, ticketTypes, selectedTicketTypeId, checkoutReturn }: Props) {
  const storedSelection = useMemo(readStoredSelection, []);
  const hasTicketSelection = Boolean(
    selectedTicketTypeId
      || storedSelection?.ticketTypeId
      || storedSelection?.productCode === "simple"
      || ticketTypes.some((item) => item.status === "open"),
  );

  const [buyer, setBuyer] = useState({ name: auth.name || "", email: auth.email || "", phone: "" });
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() => [alumniParticipant(auth)]);
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
    if (!checkoutReturn && !auth.loggedIn) navigate("login");
  }, [auth.loggedIn, checkoutReturn, navigate]);

  useEffect(() => {
    if (checkoutReturn) return;
    let active = true;
    setCatalogLoading(true);
    getCurrentTicketCatalog()
      .then((rows) => {
        if (!active) return;
        const simpleRows = rows.filter((item) => item.product_code === "simple");
        setCatalog(simpleRows);
        setCatalogError(simpleRows.length ? "" : "Nenhum ingresso está disponível no lote vigente.");
      })
      .catch((cause) => {
        if (!active) return;
        setCatalogError(cause instanceof Error ? cause.message : "Não foi possível carregar o valor do ingresso.");
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [checkoutReturn]);

  useEffect(() => {
    if (!auth.userId) {
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    (supabase as any)
      .from("profiles")
      .select("display_name,contact_email,contact_phone,person_id,people(full_name)")
      .eq("user_id", auth.userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active) return;
        const name = data?.display_name || data?.people?.full_name || auth.name || "";
        const email = data?.contact_email || auth.email || "";
        setProfilePersonId(data?.person_id || null);
        setBuyer((current) => ({
          ...current,
          name: name || current.name,
          email: email || current.email,
          phone: current.phone || data?.contact_phone || "",
        }));
        setParticipants((current) => current.map((participant) => participant.participant_type === "alumni" ? {
          ...participant,
          full_name: name,
          email,
          person_id: data?.person_id || null,
          user_id: auth.userId,
        } : participant));
      })
      .catch(() => setProfilePersonId(null))
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

  const currentProduct = catalog[0] ?? null;
  const childParticipants = participants.filter((item) => item.participant_type === "child");
  const hasSpouse = participants.some((item) => item.participant_type === "spouse");
  const prices = participants.map(participantPrice);
  const hasUnknownPrice = prices.some((price) => price === null);
  const estimatedTotal = prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);

  function updateParticipant(clientKey: string, patch: Partial<ParticipantDraft>) {
    setParticipants((current) => current.map((item) => item.client_key === clientKey ? { ...item, ...patch } : item));
    setError("");
  }

  function toggleSpouse() {
    setParticipants((current) => {
      const existing = current.find((item) => item.participant_type === "spouse");
      if (existing) return current.filter((item) => item.client_key !== existing.client_key);
      if (current.length >= MAX_PARTICIPANTS) return current;
      return [...current, spouseParticipant()];
    });
    setError("");
  }

  function addChild() {
    if (participants.length >= MAX_PARTICIPANTS) return;
    setParticipants((current) => [...current, childParticipant()]);
    setError("");
  }

  function removeParticipant(clientKey: string) {
    setParticipants((current) => current.filter((item) => item.client_key !== clientKey));
    setError("");
  }

  function validate() {
    if (!auth.loggedIn || !auth.userId) return "Entre na sua conta para continuar.";
    if (profileLoading) return "Aguarde a validação do cadastro do ex-aluno.";
    if (!profilePersonId) return "Conclua seu cadastro de ex-aluno antes de comprar o ingresso.";
    if (!currentProduct || !isCatalogItemAvailable(currentProduct)) return "O ingresso não está disponível no lote vigente.";
    if (!buyer.name.trim() || !buyer.email.trim() || !buyer.phone.trim()) return "Preencha nome, e-mail e Telefone do comprador.";
    if (!/^\S+@\S+\.\S+$/.test(buyer.email)) return "Informe um e-mail válido.";
    if (participants.length < 1 || participants.length > MAX_PARTICIPANTS) return "O pedido deve ter entre 1 e 6 participantes.";

    const alumni = participants.filter((item) => item.participant_type === "alumni");
    const spouses = participants.filter((item) => item.participant_type === "spouse");
    if (alumni.length !== 1) return "O pedido deve conter exatamente um ex-aluno vinculado à conta.";
    if (spouses.length > 1) return "É permitido incluir no máximo um cônjuge.";

    for (const participant of participants) {
      if (!participant.full_name.trim()) return "Informe o nome completo de todos os participantes.";
      if (participant.participant_type === "child") {
        if (!participant.birth_date) return "Informe a data de nascimento de cada filho.";
        const age = ageOnEventDate(participant.birth_date);
        if (age === null || age < 0) return "Confira a data de nascimento informada para o filho.";
      }
    }
    if (!acceptTerms) return "Aceite os Termos de Uso e a Política de Privacidade.";
    return "";
  }

  async function submit() {
    const validation = validate();
    if (validation) {
      setError(validation);
      if (validation.includes("cadastro de ex-aluno")) navigate("claim-profile");
      return;
    }

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
        product_code: "simple",
        participants: cleanParticipants,
        terms_accepted: true,
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
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="bg-[#2d6a4f] px-5 py-3 font-semibold text-white" onClick={() => navigate("my-ticket")}>Ver meus ingressos</button>
              <button className="border border-[#2d6a4f]/40 px-5 py-3 text-[#f0ebe0]" onClick={() => navigate("home")}>Voltar ao site</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasTicketSelection && !catalogLoading) return null;

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <button onClick={() => navigate("tickets")} className="mb-8 flex items-center gap-2 text-sm text-[#7a9a7a]"><ArrowLeft size={16} /> Voltar aos ingressos</button>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Checkout seguro</p>
        <h1 className="mt-2 font-['Playfair_Display'] text-4xl font-bold text-[#f0ebe0] md:text-5xl">Participantes e pagamento</h1>
        <p className="mt-3 text-[#8ab89a]">Ingresso único de R$ 120 por pessoa, com churrasco incluído. Cada pessoa leva sua própria bebida.</p>

        <section className="mt-8 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">Lote vigente</p>
          {catalogLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-[#8ab89a]"><RefreshCw size={16} className="animate-spin" />Carregando valor...</p>
          ) : currentProduct ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#f0ebe0]">Ingresso</h2>
                <p className="mt-1 text-sm text-[#8ab89a]">{currentProduct.lot_name}</p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7a9a7a]">Adultos e cônjuges: R$ 120. Filhos até 8 anos: grátis. De 9 a 12 anos: R$ 60. A partir de 13 anos: R$ 120.</p>
              </div>
              <p className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">{formatCatalogPrice(currentProduct.price_cents)}</p>
            </div>
          ) : <p className="mt-4 text-sm text-[#e74c3c]">{catalogError || "Ingresso indisponível."}</p>}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <h2 className="text-xl font-semibold text-[#f0ebe0]">Dados do comprador</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className={inputClass()} placeholder="Nome completo" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} />
            <input className={inputClass()} type="email" placeholder="E-mail" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} />
            <input className={`${inputClass()} md:col-span-2`} placeholder="Telefone" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} />
          </div>
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#f0ebe0]">Quem vai com você?</h2>
              <p className="mt-1 text-sm text-[#7a9a7a]">O ex-aluno já faz parte do pedido. Adicione cônjuge e filhos, se necessário.</p>
            </div>
            <span className="font-mono text-xs text-[#c9a84c]">{participants.length}/{MAX_PARTICIPANTS}</span>
          </div>

          <div className="mt-5 space-y-4">
            {participants.map((participant, index) => {
              const price = participantPrice(participant);
              const age = participant.participant_type === "child" ? ageOnEventDate(participant.birth_date) : null;
              return (
                <div key={participant.client_key} className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#c9a84c]">{participantLabel(participant, childParticipants.indexOf(participant))}</p>
                      <p className="mt-1 text-sm text-[#8ab89a]">{price === null ? "Valor calculado após informar a data" : formatCatalogPrice(price)}{age !== null ? ` · ${age} anos em 26/09` : ""}</p>
                    </div>
                    {participant.participant_type !== "alumni" && (
                      <button type="button" aria-label={`Remover ${participantLabel(participant, index)}`} onClick={() => removeParticipant(participant.client_key)} className="p-2 text-[#e07a5f]"><Trash2 size={17} /></button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className={inputClass()} value={participant.full_name} readOnly={participant.participant_type === "alumni"} placeholder="Nome completo" onChange={(event) => updateParticipant(participant.client_key, { full_name: event.target.value })} />
                    {participant.participant_type === "child" ? (
                      <input className={inputClass()} type="date" aria-label="Data de nascimento" value={participant.birth_date || ""} onChange={(event) => updateParticipant(participant.client_key, { birth_date: event.target.value })} />
                    ) : participant.participant_type === "spouse" ? (
                      <input className={inputClass()} type="email" placeholder="E-mail do cônjuge (opcional)" value={participant.email || ""} onChange={(event) => updateParticipant(participant.client_key, { email: event.target.value })} />
                    ) : (
                      <input className={inputClass()} type="email" value={participant.email || ""} readOnly placeholder="E-mail" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={toggleSpouse} disabled={!hasSpouse && participants.length >= MAX_PARTICIPANTS} className="flex items-center gap-2 border border-[#2d6a4f]/45 px-4 py-3 text-sm text-[#f0ebe0] disabled:opacity-40">
              {hasSpouse ? <Trash2 size={16} /> : <Plus size={16} />} {hasSpouse ? "Remover cônjuge" : "Adicionar cônjuge"}
            </button>
            <button type="button" onClick={addChild} disabled={participants.length >= MAX_PARTICIPANTS} className="flex items-center gap-2 border border-[#2d6a4f]/45 px-4 py-3 text-sm text-[#f0ebe0] disabled:opacity-40"><Plus size={16} /> Adicionar filho(a)</button>
          </div>
        </section>

        <section className="mt-6 border border-[#c9a84c]/25 bg-[#17190e] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c9a84c]">Total estimado</p>
              {hasUnknownPrice && <p className="mt-1 text-xs text-[#8ab89a]">Preencha a data de nascimento dos filhos para fechar o total.</p>}
            </div>
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">{formatCatalogPrice(estimatedTotal)}</p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#7a9a7a]">O servidor recalcula cada participante antes de criar a cobrança. O churrasco está incluído; bebidas não estão incluídas.</p>
        </section>

        <label className="mt-6 flex cursor-pointer items-start gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-4 text-sm leading-relaxed text-[#8ab89a]">
          <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1" />
          <span>Li e aceito os <button type="button" className="text-[#c9a84c] underline" onClick={() => navigate("terms")}>Termos de Uso</button> e a <button type="button" className="text-[#c9a84c] underline" onClick={() => navigate("privacy")}>Política de Privacidade</button>.</span>
        </label>

        {error && <div className="mt-5 border border-[#e07a5f]/40 bg-[#311613] p-4 text-sm text-[#f2a399]">{error}</div>}

        <button type="button" disabled={busy || catalogLoading || !currentProduct} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-3 bg-[#2d6a4f] px-6 py-4 font-bold uppercase tracking-[0.13em] text-white disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />} {busy ? "Preparando pagamento..." : "Continuar para pagamento"}
        </button>
        <p className="mt-3 text-center text-xs text-[#7a9a7a]">O aceite dos termos é registrado com o pedido antes do redirecionamento seguro para o Mercado Pago.</p>
      </div>
    </div>
  );
}
