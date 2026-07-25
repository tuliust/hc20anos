import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Plus, RefreshCw, Shield, Trash2, UserPlus } from "lucide-react";
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

type ProductCode = "simple" | "family_full" | "family_single_parent" | "external_guest";
type ParticipantDraft = CheckoutParticipantInput & { approval_request_id?: string | null };

type StoredSelection = {
  selectedAt?: number;
  productCode?: ProductCode | null;
  ticketTypeId?: string | null;
};

type GuestApprovalRow = {
  id: string;
  perspective: "guest" | "sponsor";
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  relationship_to_alumni: string;
  sponsor_person_id: string;
  sponsor_name: string;
  status: string;
};

const SELECTION_KEY = "hc-checkout-ticket-selected";
const PRIMARY_PRODUCT_CODES: ProductCode[] = ["simple", "family_full", "family_single_parent", "external_guest"];
const EVENT_DATE = new Date("2026-10-24T12:00:00-03:00");

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

function productFromTicket(ticket?: DbTicketType | null): ProductCode {
  const code = String((ticket as DbTicketType & { product_code?: string | null } | null)?.product_code ?? "");
  if (PRIMARY_PRODUCT_CODES.includes(code as ProductCode)) return code as ProductCode;
  const name = String(ticket?.name ?? "").toLocaleLowerCase("pt-BR");
  if (name.includes("convidado")) return "external_guest";
  if (name.includes("família") && (name.includes("sem cônjuge") || name.includes("monoparental"))) return "family_single_parent";
  if (name.includes("família") || name.includes("casal")) return "family_full";
  return "simple";
}

function guestParticipant(auth: AuthState, approval?: GuestApprovalRow | null): ParticipantDraft {
  return {
    client_key: key("guest"),
    participant_type: "external_guest",
    full_name: approval?.guest_name || auth.name || "",
    email: approval?.guest_email || auth.email || "",
    phone: approval?.guest_phone || "",
    relationship_to_alumni: approval?.relationship_to_alumni || null,
    sponsor_person_id: approval?.sponsor_person_id || null,
    user_id: auth.userId || null,
    approval_request_id: approval?.id || null,
  };
}

function defaultParticipants(product: ProductCode, auth: AuthState, approval?: GuestApprovalRow | null): ParticipantDraft[] {
  if (product === "external_guest") return [guestParticipant(auth, approval)];

  const alumni: ParticipantDraft = {
    client_key: key("alumni"),
    participant_type: "alumni",
    full_name: auth.name || "",
    email: auth.email || "",
    user_id: auth.userId || null,
  };
  if (product === "simple") return [alumni];

  const child: ParticipantDraft = {
    client_key: key("child"),
    participant_type: "child",
    full_name: "",
    birth_date: "",
  };
  if (product === "family_single_parent") return [alumni, child];
  return [
    alumni,
    { client_key: key("spouse"), participant_type: "spouse", full_name: "" },
    child,
  ];
}

function isFamilyProduct(product: ProductCode) {
  return product === "family_full" || product === "family_single_parent";
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
  if (participant.participant_type === "external_guest") return "Convidado aprovado";
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
  const initialProduct = storedSelection?.productCode && PRIMARY_PRODUCT_CODES.includes(storedSelection.productCode)
    ? storedSelection.productCode
    : productFromTicket(fallbackTicket);
  const hasTicketSelection = Boolean(selectedTicketTypeId || storedSelection?.ticketTypeId || storedSelection?.productCode);

  const [productCode, setProductCode] = useState<ProductCode>(initialProduct);
  const [buyer, setBuyer] = useState({ name: auth.name || "", email: auth.email || "", phone: "" });
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() => defaultParticipants(initialProduct, auth));
  const [catalog, setCatalog] = useState<CurrentTicketCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(!checkoutReturn);
  const [catalogError, setCatalogError] = useState("");
  const [profilePersonId, setProfilePersonId] = useState<string | null>(null);
  const [guestApprovals, setGuestApprovals] = useState<GuestApprovalRow[]>([]);
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
          ?? rows.find((item) => item.product_code === storedSelection?.productCode);
        if (selected && PRIMARY_PRODUCT_CODES.includes(selected.product_code as ProductCode)) {
          const nextProduct = selected.product_code as ProductCode;
          setProductCode(nextProduct);
          setParticipants(defaultParticipants(nextProduct, auth));
        }
        setCatalogError(rows.length ? "" : "Nenhum produto está disponível no lote vigente.");
      })
      .catch((cause) => {
        if (!active) return;
        setCatalogError(cause instanceof Error ? cause.message : "Não foi possível carregar os valores do lote vigente.");
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [auth, checkoutReturn, selectedTicketTypeId, storedSelection?.productCode, storedSelection?.ticketTypeId]);

  useEffect(() => {
    if (!auth.userId) return;
    let active = true;
    (supabase as any)
      .from("profiles")
      .select("display_name,contact_email,contact_whatsapp,person_id,people(full_name)")
      .eq("user_id", auth.userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active || !data) return;
        const name = data.display_name || data.people?.full_name || auth.name || "";
        const email = data.contact_email || auth.email || "";
        setProfilePersonId(data.person_id || null);
        setBuyer((current) => ({
          ...current,
          name: current.name || name,
          email: current.email || email,
          phone: current.phone || data.contact_whatsapp || "",
        }));
        setParticipants((current) => current.map((participant) => participant.participant_type === "alumni" ? {
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
    if (!auth.userId || checkoutReturn) return;
    let active = true;
    (supabase as any).rpc("get_my_guest_approval_requests")
      .then(({ data, error: approvalError }: any) => {
        if (!active || approvalError) return;
        const rows = (Array.isArray(data) ? data : []) as GuestApprovalRow[];
        setGuestApprovals(rows.filter((row) => row.status === "approved"));
      });
    return () => { active = false; };
  }, [auth.userId, checkoutReturn]);

  const selfGuestApproval = useMemo(
    () => guestApprovals.find((row) => row.perspective === "guest" && row.status === "approved") ?? null,
    [guestApprovals],
  );

  useEffect(() => {
    if (productCode !== "external_guest" || !selfGuestApproval) return;
    setParticipants((current) => current.map((participant) => participant.participant_type === "external_guest" ? {
      ...participant,
      full_name: selfGuestApproval.guest_name,
      email: selfGuestApproval.guest_email,
      phone: selfGuestApproval.guest_phone,
      relationship_to_alumni: selfGuestApproval.relationship_to_alumni,
      sponsor_person_id: selfGuestApproval.sponsor_person_id,
      user_id: auth.userId || null,
      approval_request_id: selfGuestApproval.id,
    } : participant));
  }, [auth.userId, productCode, selfGuestApproval]);

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
  const additionalChildProduct = catalogByCode.get("additional_child") ?? null;
  const externalGuestProduct = catalogByCode.get("external_guest") ?? null;

  const sponsorGuestApprovals = useMemo(
    () => guestApprovals.filter((row) => row.perspective === "sponsor" && row.status === "approved"),
    [guestApprovals],
  );
  const usedApprovalIds = useMemo(
    () => new Set(participants.map((participant) => participant.approval_request_id).filter(Boolean)),
    [participants],
  );
  const availableApprovedGuests = sponsorGuestApprovals.filter((row) => !usedApprovalIds.has(row.id));

  const upgradeOptions = useMemo(() => {
    const options: Array<{ target: ProductCode; title: string; description: string }> = [];
    if (productCode === "simple") {
      options.push({ target: "family_single_parent", title: "Adicionar filho(a)", description: "Altera o ingresso para Família sem cônjuge." });
      options.push({ target: "family_full", title: "Adicionar cônjuge e filho(a)", description: "Altera o ingresso para Família completa." });
    } else if (productCode === "family_single_parent") {
      options.push({ target: "family_full", title: "Adicionar cônjuge", description: "Altera o ingresso para Família completa." });
    }
    return options.filter((option) => isCatalogItemAvailable(catalogByCode.get(option.target)));
  }, [catalogByCode, productCode]);

  const estimatedTotal = useMemo(() => {
    const base = currentProduct?.price_cents ?? 0;
    const children = participants.filter((participant) => participant.participant_type === "child");
    const eligibleChildren = children.filter((participant) => {
      const age = ageOnEventDate(participant.birth_date);
      return age === null || age <= 12;
    }).length;
    const olderChildren = children.length - eligibleChildren;
    const includedChildren = isFamilyProduct(productCode) ? 1 : 0;
    const chargeableChildren = olderChildren + Math.max(eligibleChildren - includedChildren, 0);
    const externalCount = participants.filter((participant) => participant.participant_type === "external_guest").length;
    const includedExternal = productCode === "external_guest" ? 1 : 0;
    const chargeableExternal = Math.max(externalCount - includedExternal, 0);
    return base
      + chargeableChildren * (additionalChildProduct?.price_cents ?? 0)
      + chargeableExternal * (externalGuestProduct?.price_cents ?? 0);
  }, [additionalChildProduct?.price_cents, currentProduct?.price_cents, externalGuestProduct?.price_cents, participants, productCode]);

  function updateParticipant(clientKey: string, patch: Partial<ParticipantDraft>) {
    setParticipants((current) => current.map((item) => item.client_key === clientKey ? { ...item, ...patch } : item));
  }

  function changeProduct(next: ProductCode) {
    const alumni = participants.find((participant) => participant.participant_type === "alumni")
      ?? defaultParticipants("simple", auth)[0];
    const guests = participants.filter((participant) => participant.participant_type === "external_guest");
    const children = participants.filter((participant) => participant.participant_type === "child");
    const spouse = participants.find((participant) => participant.participant_type === "spouse")
      ?? { client_key: key("spouse"), participant_type: "spouse" as const, full_name: "" };
    const firstChild = children[0]
      ?? { client_key: key("child"), participant_type: "child" as const, full_name: "", birth_date: "" };

    let nextParticipants: ParticipantDraft[];
    if (next === "simple") nextParticipants = [alumni, ...guests];
    else if (next === "family_single_parent") nextParticipants = [alumni, firstChild, ...children.slice(1), ...guests];
    else if (next === "family_full") nextParticipants = [alumni, spouse, firstChild, ...children.slice(1), ...guests];
    else nextParticipants = [guestParticipant(auth, selfGuestApproval)];

    if (nextParticipants.length > 6) {
      setError("O pedido pode ter no máximo seis participantes.");
      return;
    }
    setProductCode(next);
    setParticipants(nextParticipants);
    setError("");
  }

  function addChild() {
    if (!isFamilyProduct(productCode) || !isCatalogItemAvailable(additionalChildProduct) || participants.length >= 6) return;
    setParticipants((current) => [...current, {
      client_key: key("child"),
      participant_type: "child",
      full_name: "",
      birth_date: "",
    }]);
    setError("");
  }

  function addApprovedGuest(approval: GuestApprovalRow) {
    if (productCode === "external_guest" || participants.length >= 6 || usedApprovalIds.has(approval.id)) return;
    if (!profilePersonId || approval.sponsor_person_id !== profilePersonId) {
      setError("A aprovação deste convidado não pertence ao ex-aluno comprador.");
      return;
    }
    setParticipants((current) => [...current, {
      client_key: key("guest"),
      participant_type: "external_guest",
      full_name: approval.guest_name,
      email: approval.guest_email,
      phone: approval.guest_phone,
      relationship_to_alumni: approval.relationship_to_alumni,
      sponsor_person_id: approval.sponsor_person_id,
      sponsor_user_id: auth.userId || null,
      approval_request_id: approval.id,
    }]);
    setError("");
  }

  function canRemoveParticipant(participant: ParticipantDraft) {
    if (participant.participant_type === "external_guest" && productCode !== "external_guest") return true;
    if (participant.participant_type !== "child") return false;
    return participants.filter((item) => item.participant_type === "child").length > 1;
  }

  function removeParticipant(clientKey: string) {
    setParticipants((current) => current.filter((item) => item.client_key !== clientKey));
  }

  function participantPriceText(participant: ParticipantDraft) {
    if (participant.participant_type === "external_guest") {
      return productCode === "external_guest"
        ? "Incluído no ingresso principal"
        : formatCatalogPrice(externalGuestProduct?.price_cents ?? 0);
    }
    if (participant.participant_type === "child") {
      const children = participants.filter((item) => item.participant_type === "child");
      const childIndex = children.findIndex((item) => item.client_key === participant.client_key);
      const age = ageOnEventDate(participant.birth_date);
      const included = isFamilyProduct(productCode) && childIndex === 0 && (age === null || age <= 12);
      return included ? "Incluído no ingresso principal" : formatCatalogPrice(additionalChildProduct?.price_cents ?? 0);
    }
    return "Incluído no ingresso principal";
  }

  function validate() {
    if (!currentProduct || !isCatalogItemAvailable(currentProduct)) return "O ingresso selecionado não está disponível no lote vigente.";
    if (!buyer.name.trim() || !buyer.email.trim() || !buyer.phone.trim()) return "Preencha nome, e-mail e WhatsApp do comprador.";
    if (!/^\S+@\S+\.\S+$/.test(buyer.email)) return "Informe um e-mail válido.";
    if (participants.length < 1 || participants.length > 6) return "O pedido deve ter entre 1 e 6 participantes.";
    for (const participant of participants) {
      if (!participant.full_name.trim()) return "Informe o nome completo de todos os participantes.";
      if (participant.participant_type === "child" && !participant.birth_date) return "Informe a data de nascimento de cada filho.";
      if (participant.participant_type === "external_guest") {
        if (!participant.email?.trim() || !participant.phone?.trim() || !participant.sponsor_person_id) {
          return "O convidado precisa estar aprovado e ter nome, e-mail e telefone cadastrados.";
        }
        if (!participant.approval_request_id) return "Selecione somente convidados com aprovação confirmada.";
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
      const cleanParticipants: CheckoutParticipantInput[] = participants.map(({ approval_request_id: _approval, ...participant }) => ({
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
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">Ingresso principal</p>
          {catalogLoading ? <p className="mt-4 flex items-center gap-2 text-sm text-[#8ab89a]"><RefreshCw size={16} className="animate-spin" />Carregando lote e valores...</p> : currentProduct ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-xl font-semibold text-[#f0ebe0]">{PRODUCT_LABELS[productCode]}</h2><p className="mt-1 text-sm text-[#8ab89a]">{currentProduct.lot_name}</p></div>
              <p className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">{formatCatalogPrice(currentProduct.price_cents)}</p>
            </div>
          ) : <p className="mt-4 text-sm text-[#e74c3c]">{catalogError || "Ingresso indisponível."}</p>}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <h2 className="text-xl font-semibold text-[#f0ebe0]">Dados do comprador</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><input className={inputClass()} placeholder="Nome completo" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} /><input className={inputClass()} placeholder="E-mail" type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} /><input className={`${inputClass()} md:col-span-2`} placeholder="WhatsApp" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} /></div>
        </section>

        {productCode !== "external_guest" && (
          <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
            <h2 className="text-xl font-semibold text-[#f0ebe0]">Deseja adicionar acompanhantes ou convidados?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#8ab89a]">As opções, disponibilidades e valores abaixo são carregados diretamente do lote vigente configurado no painel administrativo.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {upgradeOptions.map((option) => {
                const target = catalogByCode.get(option.target)!;
                return <button key={option.target} type="button" onClick={() => changeProduct(option.target)} className="border border-[#2d6a4f]/40 bg-[#0d1a0f] p-4 text-left hover:border-[#c9a84c]"><strong className="block text-[#f0ebe0]">{option.title}</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ab89a]">{option.description}</span><span className="mt-3 block font-semibold text-[#c9a84c]">Novo total: {formatCatalogPrice(target.price_cents)}</span></button>;
              })}

              {isFamilyProduct(productCode) && isCatalogItemAvailable(additionalChildProduct) && participants.length < 6 && (
                <button type="button" onClick={addChild} className="border border-[#2d6a4f]/40 bg-[#0d1a0f] p-4 text-left hover:border-[#c9a84c]"><strong className="block text-[#f0ebe0]">Adicionar filho(a) adicional</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ab89a]">Será criado um ingresso individual para o participante.</span><span className="mt-3 block font-semibold text-[#c9a84c]">{formatCatalogPrice(additionalChildProduct.price_cents)}</span></button>
              )}
            </div>

            {isCatalogItemAvailable(externalGuestProduct) && (
              <div className="mt-6 border-t border-[#2d6a4f]/25 pt-5">
                <div className="flex items-start gap-3"><UserPlus size={20} className="mt-0.5 shrink-0 text-[#c9a84c]" /><div><h3 className="font-semibold text-[#f0ebe0]">Convidados aprovados</h3><p className="mt-1 text-sm text-[#8ab89a]">Somente convidados que já concluíram o fluxo de aprovação podem ser incluídos neste pedido.</p></div></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {availableApprovedGuests.map((approval) => <button key={approval.id} type="button" disabled={participants.length >= 6} onClick={() => addApprovedGuest(approval)} className="border border-[#2d6a4f]/40 bg-[#0d1a0f] p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#c9a84c]"><strong className="block text-[#f0ebe0]">Adicionar {approval.guest_name}</strong><span className="mt-1 block text-xs text-[#8ab89a]">{approval.relationship_to_alumni}</span><span className="mt-3 block font-semibold text-[#c9a84c]">{formatCatalogPrice(externalGuestProduct.price_cents)}</span></button>)}
                </div>
                {!availableApprovedGuests.length && <p className="mt-4 border border-dashed border-[#2d6a4f]/30 p-4 text-sm leading-relaxed text-[#8ab89a]">Nenhum convidado aprovado está disponível para inclusão. O convidado deve solicitar a aprovação do ex-aluno antes da compra.</p>}
              </div>
            )}

            {!upgradeOptions.length && !isCatalogItemAvailable(additionalChildProduct) && !isCatalogItemAvailable(externalGuestProduct) && <p className="mt-5 border border-dashed border-[#2d6a4f]/30 p-4 text-sm text-[#8ab89a]">Não há produtos adicionais ativos neste lote.</p>}
          </section>
        )}

        <section className="mt-6 space-y-4">
          {participants.map((participant, index) => (
            <div key={participant.client_key} className="border border-[#2d6a4f]/30 bg-[#141f14] p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-wider text-[#c9a84c]">Participante {index + 1}</p><h3 className="mt-1 text-lg font-semibold text-[#f0ebe0]">{participantLabel(participant)}</h3><p className="mt-1 text-xs text-[#8ab89a]">{participantPriceText(participant)}</p></div>{canRemoveParticipant(participant) && <button type="button" aria-label={`Remover ${participantLabel(participant)}`} onClick={() => removeParticipant(participant.client_key)} className="text-[#e74c3c]"><Trash2 size={18} /></button>}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input className={inputClass()} placeholder="Nome completo" readOnly={Boolean(participant.approval_request_id)} value={participant.full_name} onChange={(event) => updateParticipant(participant.client_key, { full_name: event.target.value })} />
                {participant.participant_type === "child" ? <input className={inputClass()} type="date" value={participant.birth_date ?? ""} onChange={(event) => updateParticipant(participant.client_key, { birth_date: event.target.value })} /> : <input className={inputClass()} placeholder="E-mail do participante" type="email" readOnly={Boolean(participant.approval_request_id)} value={participant.email ?? ""} onChange={(event) => updateParticipant(participant.client_key, { email: event.target.value })} />}
                {participant.participant_type === "external_guest" && <input className={`${inputClass()} md:col-span-2`} placeholder="WhatsApp do convidado" readOnly={Boolean(participant.approval_request_id)} value={participant.phone ?? ""} onChange={(event) => updateParticipant(participant.client_key, { phone: event.target.value })} />}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6">
          <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a9a7a]">Resumo estimado</p><p className="mt-2 text-sm text-[#8ab89a]">{participants.length} participante(s). O servidor confirmará o total antes de criar o pagamento.</p></div><p className="font-['Playfair_Display'] text-3xl font-bold text-[#c9a84c]">{formatCatalogPrice(estimatedTotal)}</p></div>
        </section>

        <section className="mt-6 border border-[#2d6a4f]/30 bg-[#141f14] p-6"><label className="flex items-start gap-3 text-sm text-[#8ab89a]"><input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1" /><span>Li e aceito os Termos de Uso, a Política de Privacidade e as regras de reembolso e transferência.</span></label>{(error || catalogError) && <p className="mt-4 border border-[#c0392b]/50 bg-[#2e0a0a] p-3 text-sm text-[#f0ebe0]">{error || catalogError}</p>}<button disabled={busy || catalogLoading || !currentProduct} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#2d6a4f] px-6 py-4 font-bold text-white disabled:opacity-50">{busy ? <><RefreshCw size={18} className="animate-spin" />Preparando pagamento...</> : <><Shield size={18} />Ir para o Mercado Pago</>}</button><p className="mt-3 text-center text-xs text-[#7a9a7a]">Pix ou cartão de crédito em até 3 parcelas. Boleto não disponível.</p></section>
      </div>
    </div>
  );
}
