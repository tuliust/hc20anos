import type { DbTicketType } from "./database.types";

export const PUBLIC_TICKET_PRODUCT_CODES = [
  "simple",
  "family_full",
  "family_single_parent",
  "external_guest",
] as const;

export type PublicTicketProductCode = typeof PUBLIC_TICKET_PRODUCT_CODES[number];

type PublicTicketGroup = "alumni" | "family" | "guest";
type PublishedLotCode = "initial" | "lot_1" | "lot_2" | "lot_3";

export interface PublicTicketCardModel {
  ticketType: DbTicketType;
  displayName: string;
  group: PublicTicketGroup;
  sortOrder: number;
}

type TicketWithProductCode = DbTicketType & {
  product_code?: string | null;
  active_lot_code?: string | null;
  active_lot_name?: string | null;
};

const LOT_TRANSITIONS = [
  { code: "lot_3" as const, startsAt: Date.parse("2026-09-01T03:00:00Z") },
  { code: "lot_2" as const, startsAt: Date.parse("2026-08-15T03:00:00Z") },
  { code: "lot_1" as const, startsAt: Date.parse("2026-08-01T03:00:00Z") },
];

const PUBLISHED_PRICES: Record<PublishedLotCode, Partial<Record<PublicTicketProductCode, number>>> = {
  initial: {
    simple: 10000,
    family_full: 18000,
    family_single_parent: 12000,
    external_guest: 13000,
  },
  lot_1: {
    simple: 12000,
    family_full: 20000,
    family_single_parent: 14000,
    external_guest: 15000,
  },
  lot_2: {
    simple: 14000,
    family_full: 22000,
    family_single_parent: 16000,
    external_guest: 17000,
  },
  lot_3: {
    simple: 16000,
    family_full: 24000,
    family_single_parent: 18000,
    external_guest: 19000,
  },
};

let resolvedPublicLotCode: PublishedLotCode = "initial";

function productCode(ticket: DbTicketType): string {
  return String((ticket as TicketWithProductCode).product_code ?? "");
}

function publishedLotAt(now = Date.now()): PublishedLotCode {
  return LOT_TRANSITIONS.find((lot) => now >= lot.startsAt)?.code ?? "initial";
}

function displayLotNumber(code: PublishedLotCode): number {
  if (code === "lot_2") return 2;
  if (code === "lot_3") return 3;
  return 1;
}

function withPublishedPrice(ticket: DbTicketType, lotCode: PublishedLotCode): DbTicketType {
  const code = productCode(ticket) as PublicTicketProductCode;
  const publishedPrice = PUBLISHED_PRICES[lotCode][code];
  if (publishedPrice === undefined) return ticket;

  return {
    ...ticket,
    price_cents: publishedPrice,
    active_lot_code: lotCode,
    active_lot_name: `Lote ${displayLotNumber(lotCode)}`,
  } as TicketWithProductCode;
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

export function selectPublicTicketCards(ticketTypes: DbTicketType[], now = Date.now()): PublicTicketCardModel[] {
  resolvedPublicLotCode = publishedLotAt(now);
  const candidates = ticketTypes
    .filter((ticket) => ticket.status === "open")
    .map((ticket) => withPublishedPrice(ticket, resolvedPublicLotCode))
    .map(toPublicTicketCard)
    .filter((model): model is PublicTicketCardModel => Boolean(model));

  const byGroup = new Map<PublicTicketGroup, PublicTicketCardModel>();

  for (const model of candidates) {
    const current = byGroup.get(model.group);
    if (!current) {
      byGroup.set(model.group, model);
      continue;
    }

    // O card Família representa a categoria e abre o pacote de menor preço.
    // No checkout o usuário pode alternar para Família completa.
    if (model.group === "family" && model.ticketType.price_cents < current.ticketType.price_cents) {
      byGroup.set(model.group, model);
    }
  }

  return Array.from(byGroup.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function formatLotLabel(lotCode?: string | null, lotName?: string | null): string {
  const explicitCode = String(lotCode ?? "").toLowerCase();
  const explicitMatch = explicitCode.match(/^lot_(\d+)$/);

  // A Home chama esta função após resolver o catálogo. Nesse fluxo, prevalece
  // o lote comercial vigente publicado para evitar o antigo rótulo estático.
  if (resolvedPublicLotCode) return `LOTE ${displayLotNumber(resolvedPublicLotCode)}`;
  if (explicitMatch) return `LOTE ${explicitMatch[1]}`;

  const nameMatch = String(lotName ?? "").match(/(\d+)/);
  if (nameMatch) return `LOTE ${nameMatch[1]}`;

  return "LOTE 1";
}
