import type { DbTicketType } from "./commerce.types";

export const PUBLIC_TICKET_PRODUCT_CODES = ["simple"] as const;
export type PublicTicketProductCode = typeof PUBLIC_TICKET_PRODUCT_CODES[number];

type PublicTicketGroup = "individual";

export interface PublicTicketCardModel {
  ticketType: DbTicketType;
  displayName: string;
  group: PublicTicketGroup;
  sortOrder: number;
}

type TicketWithCatalogMetadata = DbTicketType & {
  product_code?: string | null;
  active_lot_code?: string | null;
  active_lot_name?: string | null;
  active_price_cents?: number | null;
  current_lot_code?: string | null;
  current_lot_name?: string | null;
  current_price_cents?: number | null;
  lot_code?: string | null;
  lot_name?: string | null;
  lot_price_cents?: number | null;
};

let resolvedLotCode: string | null = null;
let resolvedLotName: string | null = null;

function metadata(ticket: DbTicketType): TicketWithCatalogMetadata {
  return ticket as TicketWithCatalogMetadata;
}

function normalize(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function productCode(ticket: DbTicketType): PublicTicketProductCode | "" {
  const explicitCode = String(metadata(ticket).product_code ?? "").trim();
  if (explicitCode === "simple") return "simple";
  const name = normalize(ticket.name);
  if (name.includes("ingresso") || name.includes("individual") || name.includes("ex-aluno") || name.includes("ex aluno")) return "simple";
  return "";
}

function activePrice(ticket: DbTicketType): number {
  const row = metadata(ticket);
  return row.active_price_cents
    ?? row.current_price_cents
    ?? row.lot_price_cents
    ?? ticket.price_cents;
}

function withActiveCatalogMetadata(ticket: DbTicketType): DbTicketType {
  const row = metadata(ticket);
  const lotCode = row.active_lot_code ?? row.current_lot_code ?? row.lot_code ?? null;
  const lotName = row.active_lot_name ?? row.current_lot_name ?? row.lot_name ?? null;
  if (!resolvedLotCode && lotCode) resolvedLotCode = lotCode;
  if (!resolvedLotName && lotName) resolvedLotName = lotName;
  return { ...ticket, price_cents: activePrice(ticket) };
}

export function isCheckoutExtra(_ticket: DbTicketType): boolean {
  return false;
}

export function isFamilyTicket(_ticket: DbTicketType): boolean {
  return false;
}

export function canShowAdditionalChild(_ticket: DbTicketType): boolean {
  return true;
}

export function toPublicTicketCard(ticket: DbTicketType): PublicTicketCardModel | null {
  if (productCode(ticket) !== "simple") return null;
  return { ticketType: ticket, displayName: "Ingresso", group: "individual", sortOrder: 10 };
}

export function selectPublicTicketCards(ticketTypes: DbTicketType[]): PublicTicketCardModel[] {
  resolvedLotCode = null;
  resolvedLotName = null;
  const mapped = ticketTypes
    .map(withActiveCatalogMetadata)
    .map(toPublicTicketCard)
    .filter((model): model is PublicTicketCardModel => Boolean(model));
  const open = mapped.filter((model) => model.ticketType.status === "open");
  return (open.length ? open : mapped).slice(0, 1);
}

export function formatLotLabel(lotCode?: string | null, lotName?: string | null): string {
  const code = String(resolvedLotCode ?? lotCode ?? "").toLowerCase();
  const name = String(resolvedLotName ?? lotName ?? "").trim();
  if (code === "single" || normalize(name).includes("unico")) return "LOTE ÚNICO";
  return name ? name.toLocaleUpperCase("pt-BR") : "LOTE ÚNICO";
}
