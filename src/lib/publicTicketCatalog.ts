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

function normalize(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function inferProductCodeFromName(ticket: DbTicketType): PublicTicketProductCode | "" {
  const name = normalize(ticket.name);

  if (name.includes("convidado")) return "external_guest";

  if (
    name.includes("familia sem conjuge")
    || name.includes("sem conjuge")
    || name.includes("monoparental")
  ) {
    return "family_single_parent";
  }

  if (name.includes("familia") || name.includes("casal")) return "family_full";

  if (
    name.includes("ex-aluno")
    || name.includes("ex aluno")
    || name.includes("individual")
    || name.includes("aluno")
  ) {
    return "simple";
  }

  return "";
}

function productCode(ticket: DbTicketType): string {
  const explicitCode = String(metadata(ticket).product_code ?? "").trim();
  if (PUBLIC_TICKET_PRODUCT_CODES.includes(explicitCode as PublicTicketProductCode)) {
    return explicitCode;
  }

  return inferProductCodeFromName(ticket);
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

function groupPublicCards(candidates: PublicTicketCardModel[]): PublicTicketCardModel[] {
  const byGroup = new Map<PublicTicketGroup, PublicTicketCardModel>();

  for (const model of candidates) {
    const current = byGroup.get(model.group);
    if (!current) {
      byGroup.set(model.group, model);
      continue;
    }

    const modelIsOpen = model.ticketType.status === "open";
    const currentIsOpen = current.ticketType.status === "open";

    if (modelIsOpen && !currentIsOpen) {
      byGroup.set(model.group, model);
      continue;
    }

    // O card Família representa a categoria e usa a composição disponível de menor preço.
    if (model.group === "family" && modelIsOpen === currentIsOpen && model.ticketType.price_cents < current.ticketType.price_cents) {
      byGroup.set(model.group, model);
    }
  }

  return Array.from(byGroup.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function selectPublicTicketCards(ticketTypes: DbTicketType[]): PublicTicketCardModel[] {
  resolvedLotCode = null;
  resolvedLotName = null;

  const mappedCandidates = ticketTypes
    .map(withActiveCatalogMetadata)
    .map(toPublicTicketCard)
    .filter((model): model is PublicTicketCardModel => Boolean(model));

  const openCandidates = mappedCandidates.filter((model) => model.ticketType.status === "open");

  // Prioriza vendas abertas. Se o backend não retornar nenhum status aberto,
  // mantém as três categorias visíveis em vez de deixar a página vazia.
  return groupPublicCards(openCandidates.length > 0 ? openCandidates : mappedCandidates);
}

export function formatLotLabel(lotCode?: string | null, lotName?: string | null): string {
  const code = String(resolvedLotCode ?? lotCode ?? "").toLowerCase();
  const codeMatch = code.match(/^lot_(\d+)$/);
  if (codeMatch) return `LOTE ${codeMatch[1]}`;

  const name = String(resolvedLotName ?? lotName ?? "");
  const nameMatch = name.match(/(\d+)/);
  if (nameMatch) return `LOTE ${nameMatch[1]}`;

  if (code === "initial") return "LOTE 1";
  return "LOTE 1";
}
