import type { DbTicketType } from "./database.types";

export const PUBLIC_TICKET_PRODUCT_CODES = [
  "simple",
  "family_full",
  "family_single_parent",
  "external_guest",
] as const;

export type PublicTicketProductCode = typeof PUBLIC_TICKET_PRODUCT_CODES[number];

type PublicTicketGroup = "alumni" | "family" | "guest";

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

function productCode(ticket: DbTicketType): string {
  return String(metadata(ticket).product_code ?? "");
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

  return {
    ...ticket,
    price_cents: activePrice(ticket),
  };
}

export function isCheckoutExtra(ticket: DbTicketType): boolean {
  return ["extra_drinks", "extra_barbecue", "additional_child"].includes(productCode(ticket));
}

export function isFamilyTicket(ticket: DbTicketType): boolean {
  return ["family_full", "family_single_parent"].includes(productCode(ticket));
}

export function canShowAdditionalChild(ticket: DbTicketType): boolean {
  return isFamilyTicket(ticket);
}

export function toPublicTicketCard(ticket: DbTicketType): PublicTicketCardModel | null {
  const code = productCode(ticket);

  if (code === "simple") {
    return { ticketType: ticket, displayName: "Ingresso Ex-Aluno", group: "alumni", sortOrder: 10 };
  }

  if (code === "family_full" || code === "family_single_parent") {
    return { ticketType: ticket, displayName: "Ingresso Família", group: "family", sortOrder: 20 };
  }

  if (code === "external_guest") {
    return { ticketType: ticket, displayName: "Ingresso Convidado", group: "guest", sortOrder: 30 };
  }

  return null;
}

export function selectPublicTicketCards(ticketTypes: DbTicketType[]): PublicTicketCardModel[] {
  resolvedLotCode = null;
  resolvedLotName = null;

  const candidates = ticketTypes
    .filter((ticket) => ticket.status === "open")
    .map(withActiveCatalogMetadata)
    .map(toPublicTicketCard)
    .filter((model): model is PublicTicketCardModel => Boolean(model));

  const byGroup = new Map<PublicTicketGroup, PublicTicketCardModel>();

  for (const model of candidates) {
    const current = byGroup.get(model.group);
    if (!current) {
      byGroup.set(model.group, model);
      continue;
    }

    // O card Família representa a categoria e abre o pacote familiar de menor preço.
    // No checkout o usuário pode alternar entre as duas composições disponíveis.
    if (model.group === "family" && model.ticketType.price_cents < current.ticketType.price_cents) {
      byGroup.set(model.group, model);
    }
  }

  return Array.from(byGroup.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function formatLotLabel(lotCode?: string | null, lotName?: string | null): string {
  const code = String(resolvedLotCode ?? lotCode ?? "").toLowerCase();
  const codeMatch = code.match(/^lot_(\d+)$/);
  if (codeMatch) return `LOTE ${codeMatch[1]}`;

  const name = String(resolvedLotName ?? lotName ?? "");
  const nameMatch = name.match(/(\d+)/);
  if (nameMatch) return `LOTE ${nameMatch[1]}`;

  // O lote inicial é apresentado publicamente como LOTE 1.
  if (code === "initial") return "LOTE 1";
  return "LOTE 1";
}
