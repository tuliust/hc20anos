import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Archive, CheckCircle2, Package, Plus, RefreshCw, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";

type LotStatus = "scheduled" | "open" | "closed" | "archived";

type AdminProduct = {
  id: string;
  product_code?: string | null;
  name: string;
  description?: string | null;
  status: string;
  available_quantity: number;
  sold_quantity: number;
  sort_order: number;
};

type AdminLotPrice = {
  ticket_type_id: string;
  price_cents: number;
  is_active: boolean;
};

type AdminLot = {
  id: string;
  event_id: string;
  code: string;
  name: string;
  sort_order: number;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity?: number | null;
  status: LotStatus;
  prices: AdminLotPrice[];
};

type AdminLotsPayload = {
  event_id: string;
  products: AdminProduct[];
  lots: AdminLot[];
  saved_lot_id?: string;
  archived_lot_id?: string;
};

type PriceDraft = {
  active: boolean;
  value: string;
};

type LotDraft = {
  id: string | null;
  code: string;
  name: string;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  status: LotStatus;
  prices: Record<string, PriceDraft>;
};

const inputClass = "w-full border border-[#2d6a4f]/30 bg-[#1a2e1a] px-4 py-3 text-sm text-[#f0ebe0] outline-none transition-colors focus:border-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a9a7a]";

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isLotsRoute() {
  const path = normalizedPath();
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "lots" && (path === "/admin/tickets" || path === "/admin");
}

function findAdminContentHost() {
  const adminRoot = document.querySelector<HTMLElement>("main > div.min-h-screen");
  if (!adminRoot) return null;

  return Array.from(adminRoot.children).find((child): child is HTMLElement => {
    if (!(child instanceof HTMLElement)) return false;
    const classes = String(child.className);
    return classes.includes("max-w-7xl") && classes.includes("mx-auto") && classes.includes("p-4");
  }) ?? null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function currencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function statusLabel(status: LotStatus) {
  const labels: Record<LotStatus, string> = {
    scheduled: "Agendado",
    open: "Aberto",
    closed: "Encerrado",
    archived: "Arquivado",
  };
  return labels[status];
}

function normalizePayload(value: unknown): AdminLotsPayload {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    event_id: String(row.event_id ?? DEFAULT_EVENT_ID),
    products: Array.isArray(row.products) ? row.products as AdminProduct[] : [],
    lots: Array.isArray(row.lots) ? row.lots as AdminLot[] : [],
    saved_lot_id: typeof row.saved_lot_id === "string" ? row.saved_lot_id : undefined,
    archived_lot_id: typeof row.archived_lot_id === "string" ? row.archived_lot_id : undefined,
  };
}

function createEmptyDraft(payload: AdminLotsPayload): LotDraft {
  const nextSortOrder = payload.lots.reduce((max, lot) => Math.max(max, Number(lot.sort_order) || 0), 0) + 10;
  return {
    id: null,
    code: `lot_${Math.max(1, Math.ceil(nextSortOrder / 10))}`,
    name: "",
    sortOrder: String(nextSortOrder),
    startsAt: "",
    endsAt: "",
    capacity: "",
    status: "scheduled",
    prices: Object.fromEntries(payload.products.map(product => [
      product.id,
      {
        active: product.status === "open" && !["additional_child", "extra_drinks", "extra_barbecue"].includes(String(product.product_code ?? "")),
        value: "0.00",
      },
    ])),
  };
}

function createDraftFromLot(payload: AdminLotsPayload, lot: AdminLot): LotDraft {
  const prices = new Map(lot.prices.map(price => [price.ticket_type_id, price]));
  return {
    id: lot.id,
    code: lot.code,
    name: lot.name,
    sortOrder: String(lot.sort_order),
    startsAt: toLocalDateTime(lot.starts_at),
    endsAt: toLocalDateTime(lot.ends_at),
    capacity: lot.capacity == null ? "" : String(lot.capacity),
    status: lot.status,
    prices: Object.fromEntries(payload.products.map(product => {
      const price = prices.get(product.id);
      return [product.id, {
        active: Boolean(price?.is_active),
        value: ((price?.price_cents ?? 0) / 100).toFixed(2),
      }];
    })),
  };
}

function humanizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error ?? "");
  if (message.includes("another_open_lot_exists")) return "Já existe outro lote aberto. Encerre-o antes de abrir este lote.";
  if (message.includes("open_lot_requires_active_price")) return "Um lote aberto precisa ter pelo menos um produto ativo com preço configurado.";
  if (message.includes("lot_end_must_be_after_start")) return "O encerramento deve ser posterior ao início do lote.";
  if (message.includes("duplicate key") && message.includes("code")) return "Já existe um lote com esse código.";
  if (message.includes("duplicate key") && message.includes("sort_order")) return "Já existe um lote com essa ordem.";
  if (message.includes("admin_required") || message.includes("42501")) return "Apenas administradores podem gerenciar lotes e preços.";
  return message || "Não foi possível concluir a operação.";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={labelClass}>{children}</label>;
}

function AdminTicketLotsPanel() {
  const [payload, setPayload] = useState<AdminLotsPayload>({ event_id: DEFAULT_EVENT_ID, products: [], lots: [] });
  const [draft, setDraft] = useState<LotDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedLots = useMemo(
    () => [...payload.lots].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR")),
    [payload.lots],
  );

  const load = useCallback(async (preferredLotId?: string | null) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_get_ticket_lots", {
        p_event_id: DEFAULT_EVENT_ID,
      });
      if (rpcError) throw rpcError;
      const nextPayload = normalizePayload(data);
      setPayload(nextPayload);
      const selectedId = preferredLotId ?? draft?.id ?? nextPayload.lots.find(lot => lot.status === "open")?.id ?? nextPayload.lots[0]?.id ?? null;
      const selected = nextPayload.lots.find(lot => lot.id === selectedId);
      setDraft(selected ? createDraftFromLot(nextPayload, selected) : createEmptyDraft(nextPayload));
    } catch (loadError) {
      setError(humanizeError(loadError));
    } finally {
      setLoading(false);
    }
  }, [draft?.id]);

  useEffect(() => {
    void load(null);
  }, []);

  function selectLot(lot: AdminLot) {
    setError("");
    setSuccess("");
    setDraft(createDraftFromLot(payload, lot));
  }

  function newLot() {
    setError("");
    setSuccess("");
    setDraft(createEmptyDraft(payload));
  }

  function updateDraft(patch: Partial<LotDraft>) {
    setDraft(current => current ? { ...current, ...patch } : current);
  }

  function updatePrice(productId: string, patch: Partial<PriceDraft>) {
    setDraft(current => current ? {
      ...current,
      prices: {
        ...current.prices,
        [productId]: { ...current.prices[productId], ...patch },
      },
    } : current);
  }

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    const code = draft.code.trim() || slugify(name);
    if (!name) {
      setError("Informe o nome do lote.");
      return;
    }
    if (!code) {
      setError("Informe um código para o lote.");
      return;
    }

    const prices = payload.products.map(product => {
      const price = draft.prices[product.id] ?? { active: false, value: "0" };
      const numericValue = Number(String(price.value).replace(",", "."));
      return {
        ticket_type_id: product.id,
        price_cents: Math.max(0, Math.round((Number.isFinite(numericValue) ? numericValue : 0) * 100)),
        is_active: price.active,
      };
    });

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_upsert_ticket_lot", {
        p_lot_id: draft.id,
        p_event_id: DEFAULT_EVENT_ID,
        p_code: code,
        p_name: name,
        p_sort_order: Math.max(0, Number(draft.sortOrder) || 0),
        p_starts_at: toIsoDateTime(draft.startsAt),
        p_ends_at: toIsoDateTime(draft.endsAt),
        p_capacity: draft.capacity.trim() ? Math.max(0, Number(draft.capacity) || 0) : null,
        p_status: draft.status,
        p_prices: prices,
      });
      if (rpcError) throw rpcError;
      const nextPayload = normalizePayload(data);
      const savedId = nextPayload.saved_lot_id ?? draft.id;
      setPayload(nextPayload);
      const savedLot = nextPayload.lots.find(lot => lot.id === savedId);
      setDraft(savedLot ? createDraftFromLot(nextPayload, savedLot) : createEmptyDraft(nextPayload));
      setSuccess("Lote e preços salvos. A Home e a página de ingressos já usam estes valores.");
      window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
    } catch (saveError) {
      setError(humanizeError(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function archiveLot() {
    if (!draft?.id) return;
    if (!window.confirm(`Arquivar o lote “${draft.name}”? Ele deixará de aparecer no catálogo público.`)) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_archive_ticket_lot", {
        p_lot_id: draft.id,
        p_event_id: DEFAULT_EVENT_ID,
      });
      if (rpcError) throw rpcError;
      const nextPayload = normalizePayload(data);
      setPayload(nextPayload);
      const nextLot = nextPayload.lots.find(lot => lot.status !== "archived") ?? nextPayload.lots[0];
      setDraft(nextLot ? createDraftFromLot(nextPayload, nextLot) : createEmptyDraft(nextPayload));
      setSuccess("Lote arquivado.");
      window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
    } catch (archiveError) {
      setError(humanizeError(archiveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section data-admin-ticket-lots-panel="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border border-[#2d6a4f]/25 bg-[#141f14] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c]">Ingressos / Lotes</p>
          <h1 className="mt-2 font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">Preços e lotes do catálogo</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7a9a7a]">Esta tela é a fonte única dos nomes de lote e valores exibidos na Home, em /ingressos e no início do checkout.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load(draft?.id)} disabled={loading || saving} className="inline-flex min-h-11 items-center gap-2 border border-[#2d6a4f]/35 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f0ebe0] disabled:opacity-40">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Atualizar
          </button>
          <button type="button" onClick={newLot} disabled={loading || saving} className="inline-flex min-h-11 items-center gap-2 bg-[#2d6a4f] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f0ebe0] disabled:opacity-40">
            <Plus size={14} />Novo lote
          </button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 border border-[#c0392b]/45 bg-[#c0392b]/10 p-4 text-sm text-[#f0ebe0]"><AlertCircle size={18} className="mt-0.5 shrink-0 text-[#e74c3c]" />{error}</div>}
      {success && <div role="status" className="flex items-start gap-3 border border-[#2d6a4f]/45 bg-[#2d6a4f]/10 p-4 text-sm text-[#74c69d]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{success}</div>}

      {loading || !draft ? (
        <div className="flex min-h-64 items-center justify-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-8 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]">
          <RefreshCw size={18} className="animate-spin" />Carregando lotes e preços...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="border border-[#2d6a4f]/25 bg-[#101a10] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a9a7a]">Lotes cadastrados</p>
              <span className="font-mono text-xs text-[#c9a84c]">{sortedLots.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {sortedLots.map(lot => {
                const selected = draft.id === lot.id;
                const activePrices = lot.prices.filter(price => price.is_active);
                const lowestPrice = activePrices.length ? Math.min(...activePrices.map(price => price.price_cents)) : null;
                return (
                  <button key={lot.id} type="button" onClick={() => selectLot(lot)} className={`border p-4 text-left transition-colors ${selected ? "border-[#c9a84c] bg-[#182719]" : "border-[#2d6a4f]/20 bg-[#0d150d] hover:border-[#2d6a4f]/55"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#f0ebe0]">{lot.name}</p>
                        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">{lot.code} · ordem {lot.sort_order}</p>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${lot.status === "open" ? "border-[#2d6a4f]/50 bg-[#2d6a4f]/20 text-[#74c69d]" : lot.status === "archived" ? "border-[#3a4a3a] text-[#7a9a7a]" : "border-[#c9a84c]/35 text-[#c9a84c]"}`}>{statusLabel(lot.status)}</span>
                    </div>
                    <p className="mt-3 text-xs text-[#7a9a7a]">{activePrices.length} produto(s) ativo(s){lowestPrice == null ? "" : ` · a partir de ${currencyFromCents(lowestPrice)}`}</p>
                  </button>
                );
              })}
              {!sortedLots.length && <p className="border border-dashed border-[#2d6a4f]/25 p-5 text-sm leading-relaxed text-[#7a9a7a]">Nenhum lote cadastrado. Crie o primeiro lote para publicar os valores.</p>}
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a9a7a]">{draft.id ? "Editar lote" : "Novo lote"}</p>
                  <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">{draft.name || "Configuração comercial"}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.id && draft.status !== "archived" && <button type="button" onClick={() => void archiveLot()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 border border-[#c0392b]/45 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#e74c3c] disabled:opacity-40"><Archive size={14} />Arquivar</button>}
                  <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 bg-[#c9a84c] px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0d1a0f] disabled:opacity-40">
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Salvando..." : "Salvar lote e preços"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2"><FieldLabel>Nome exibido ao público</FieldLabel><input className={inputClass} value={draft.name} onChange={event => updateDraft({ name: event.target.value, ...(!draft.id && !draft.code ? { code: slugify(event.target.value) } : {}) })} placeholder="Ex.: 2º Lote" /></div>
                <div><FieldLabel>Código interno</FieldLabel><input className={inputClass} value={draft.code} onChange={event => updateDraft({ code: slugify(event.target.value) })} placeholder="lot_2" /></div>
                <div><FieldLabel>Ordem</FieldLabel><input type="number" min="0" className={inputClass} value={draft.sortOrder} onChange={event => updateDraft({ sortOrder: event.target.value })} /></div>
                <div><FieldLabel>Capacidade do lote</FieldLabel><input type="number" min="0" className={inputClass} value={draft.capacity} onChange={event => updateDraft({ capacity: event.target.value })} placeholder="Sem limite específico" /></div>
                <div><FieldLabel>Status</FieldLabel><select className={inputClass} value={draft.status} onChange={event => updateDraft({ status: event.target.value as LotStatus })}><option value="scheduled">Agendado</option><option value="open">Aberto</option><option value="closed">Encerrado</option><option value="archived">Arquivado</option></select></div>
                <div><FieldLabel>Início</FieldLabel><input type="datetime-local" className={inputClass} value={draft.startsAt} onChange={event => updateDraft({ startsAt: event.target.value })} /></div>
                <div><FieldLabel>Encerramento</FieldLabel><input type="datetime-local" className={inputClass} value={draft.endsAt} onChange={event => updateDraft({ endsAt: event.target.value })} /></div>
              </div>
            </div>

            <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6">
              <div className="mb-5 flex items-start gap-3">
                <Package size={20} className="mt-0.5 shrink-0 text-[#c9a84c]" />
                <div>
                  <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">Valores por produto</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#7a9a7a]">Somente produtos ativados abaixo serão exibidos no lote vigente. Os valores são gravados em centavos no banco.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {payload.products.map(product => {
                  const price = draft.prices[product.id] ?? { active: false, value: "0.00" };
                  const remaining = Math.max(0, Number(product.available_quantity ?? 0) - Number(product.sold_quantity ?? 0));
                  return (
                    <div key={product.id} className={`grid grid-cols-1 gap-4 border p-4 md:grid-cols-[minmax(0,1fr)_150px_120px] md:items-center ${price.active ? "border-[#2d6a4f]/45 bg-[#0f1d12]" : "border-[#2d6a4f]/15 bg-[#0d150d] opacity-70"}`}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={price.active} onChange={event => updatePrice(product.id, { active: event.target.checked })} className="mt-1 h-4 w-4 accent-[#2d6a4f]" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#f0ebe0]">{product.name}</p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">{product.product_code || "sem código"} · {remaining} disponível(is)</p>
                        </div>
                      </label>
                      <div><FieldLabel>Preço</FieldLabel><input type="number" min="0" step="0.01" disabled={!price.active} className={inputClass} value={price.value} onChange={event => updatePrice(product.id, { value: event.target.value })} /></div>
                      <div className="md:text-right"><p className="font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">Prévia</p><p className="mt-1 font-semibold text-[#c9a84c]">{currencyFromCents(Math.max(0, Math.round((Number(String(price.value).replace(",", ".")) || 0) * 100)))}</p></div>
                    </div>
                  );
                })}
                {!payload.products.length && <p className="border border-dashed border-[#2d6a4f]/25 p-6 text-sm text-[#7a9a7a]">Nenhum tipo de ingresso foi encontrado para este evento.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function AdminTicketLotsMount() {
  const [routeVersion, setRouteVersion] = useState(0);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const active = useMemo(() => isLotsRoute(), [routeVersion]);

  useEffect(() => {
    const onRouteChange = () => setRouteVersion(version => version + 1);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("pushstate", onRouteChange);
    return () => {
      window.removeEventListener("popstate", onRouteChange);
      window.removeEventListener("pushstate", onRouteChange);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setMountNode(null);
      return;
    }

    let container = document.querySelector<HTMLElement>("[data-admin-ticket-lots-container]");
    let hiddenChildren: Array<{ element: HTMLElement; display: string }> = [];

    const ensureMount = () => {
      if (container?.isConnected) return;
      const host = findAdminContentHost();
      if (!host) return;

      hiddenChildren = Array.from(host.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .map(element => ({ element, display: element.style.display }));
      hiddenChildren.forEach(({ element }) => { element.style.display = "none"; });

      container = document.createElement("div");
      container.setAttribute("data-admin-ticket-lots-container", "true");
      host.appendChild(container);
      setMountNode(container);
    };

    ensureMount();
    const observer = new MutationObserver(ensureMount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      hiddenChildren.forEach(({ element, display }) => { element.style.display = display; });
      container?.remove();
    };
  }, [active]);

  if (!active || !mountNode) return null;
  return createPortal(<AdminTicketLotsPanel />, mountNode);
}
