import type { DbTicketType } from "./database.types";

export const PUBLIC_TICKET_PRODUCT_CODES = [
  "simple",
  "family_full",
  "family_single_parent",
  "external_guest",
] as const;

export type PublicTicketProductCode = typeof PUBLIC_TICKET_PRODUCT_CODES[number];

export interface PublicTicketCardModel {
  ticketType: DbTicketType;
  displayName: string;
  group: "alumni" | "family" | "guest";
  sortOrder: number;
}

function productCode(ticket: DbTicketType): string {
  return String((ticket as DbTicketType & { product_code?: string | null }).product_code ?? "");
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
  const byGroup = new Map<PublicTicketCardModel["group"], PublicTicketCardModel>();

  for (const ticket of ticketTypes) {
    if (ticket.status !== "open") continue;
    const model = toPublicTicketCard(ticket);
    if (!model || byGroup.has(model.group)) continue;
    byGroup.set(model.group, model);
  }

  return Array.from(byGroup.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function formatLotLabel(lotCode?: string | null, lotName?: string | null): string {
  const code = String(lotCode ?? "").toLowerCase();
  const match = code.match(/^lot_(\d+)$/);
  if (match) return `LOTE ${match[1]}`;

  const nameMatch = String(lotName ?? "").match(/(\d+)/);
  if (nameMatch) return `LOTE ${nameMatch[1]}`;

  return "LOTE 1";
}
