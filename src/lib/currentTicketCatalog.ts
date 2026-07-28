import { supabase } from "./supabase";

export const DEFAULT_TICKET_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export type TicketCatalogProductCode =
  | "simple"
  | "family_full"
  | "external_guest";

export interface CurrentTicketCatalogItem {
  lot_id: string;
  lot_code: string;
  lot_name: string;
  lot_starts_at: string | null;
  lot_ends_at: string | null;
  lot_capacity: number | null;
  ticket_type_id: string;
  product_code: TicketCatalogProductCode;
  product_name: string;
  description: string | null;
  participant_type: string | null;
  package_kind: string | null;
  included_people_count: number;
  metadata_json: Record<string, unknown>;
  price_cents: number;
  ticket_status: string;
  available_quantity: number;
  sold_quantity: number;
}

const PRODUCT_CODES = new Set<TicketCatalogProductCode>([
  "simple",
  "family_full",
  "external_guest",
]);

function normalizeRow(value: unknown): CurrentTicketCatalogItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const productCode = String(row.product_code ?? "") as TicketCatalogProductCode;
  const ticketTypeId = String(row.ticket_type_id ?? row.id ?? "");
  const lotId = String(row.lot_id ?? "");
  const priceCents = Number(row.price_cents);

  if (!PRODUCT_CODES.has(productCode) || !ticketTypeId || !lotId || !Number.isFinite(priceCents)) {
    return null;
  }

  return {
    lot_id: lotId,
    lot_code: String(row.lot_code ?? ""),
    lot_name: String(row.lot_name ?? "Lote vigente"),
    lot_starts_at: typeof row.lot_starts_at === "string" ? row.lot_starts_at : null,
    lot_ends_at: typeof row.lot_ends_at === "string" ? row.lot_ends_at : null,
    lot_capacity: Number.isFinite(Number(row.lot_capacity)) ? Number(row.lot_capacity) : null,
    ticket_type_id: ticketTypeId,
    product_code: productCode,
    product_name: String(row.product_name ?? row.name ?? productCode),
    description: typeof row.description === "string" ? row.description : null,
    participant_type: typeof row.participant_type === "string" ? row.participant_type : null,
    package_kind: typeof row.package_kind === "string" ? row.package_kind : null,
    included_people_count: Math.max(0, Number(row.included_people_count) || 0),
    metadata_json: row.metadata_json && typeof row.metadata_json === "object"
      ? row.metadata_json as Record<string, unknown>
      : {},
    price_cents: Math.max(0, Math.round(priceCents)),
    ticket_status: String(row.ticket_status ?? row.status ?? "open"),
    available_quantity: Math.max(0, Number(row.available_quantity) || 0),
    sold_quantity: Math.max(0, Number(row.sold_quantity) || 0),
  };
}

async function fetchCatalogRpc(eventId: string): Promise<unknown[]> {
  const expanded = await supabase.rpc("get_public_ticket_catalog", {
    p_event_id: eventId,
    p_at: new Date().toISOString(),
  });
  if (!expanded.error) return Array.isArray(expanded.data) ? expanded.data : [];

  const compatibility = await supabase.rpc("get_current_ticket_catalog", {
    p_event_id: eventId,
    p_at: new Date().toISOString(),
  });
  if (compatibility.error) throw compatibility.error;
  return Array.isArray(compatibility.data) ? compatibility.data : [];
}

export async function getCurrentTicketCatalog(
  eventId = DEFAULT_TICKET_EVENT_ID,
): Promise<CurrentTicketCatalogItem[]> {
  const rows = await fetchCatalogRpc(eventId);
  return rows
    .map(normalizeRow)
    .filter((row): row is CurrentTicketCatalogItem => Boolean(row));
}

export function remainingCatalogQuantity(item: CurrentTicketCatalogItem): number {
  return Math.max(0, item.available_quantity - item.sold_quantity);
}

export function isCatalogItemAvailable(item?: CurrentTicketCatalogItem | null): boolean {
  if (!item || item.ticket_status !== "open") return false;
  return remainingCatalogQuantity(item) > 0;
}

export function formatCatalogPrice(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Math.max(0, priceCents) / 100);
}
