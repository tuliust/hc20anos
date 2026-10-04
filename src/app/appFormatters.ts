import type { TicketWithDetails } from "../lib/commerce.types";
import type { DbEvent } from "../lib/content.types";
import { FALLBACK_EVENT_DATE_TIME } from "./app.constants";

export function getEventDateTime(event?: DbEvent | null): Date {
  const datePart = event?.event_date || "2026-10-17";
  const rawTime = event?.event_time || "19:00:00";
  const timePart = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const candidate = new Date(`${datePart}T${timePart}-03:00`);
  return Number.isNaN(candidate.getTime()) ? new Date(FALLBACK_EVENT_DATE_TIME) : candidate;
}

export function formatDateBR(value?: string | null) {
  if (!value) return "Data a confirmar";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShortBR(value?: string | null) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatDateTimeBR(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function eventDateTimeLabel(event?: DbEvent | null) {
  if (!event) return "17 out 2026 · 19h";
  const date = formatDateBR(event.event_date);
  const time = event.event_time?.slice(0, 5)?.replace(":", "h") ?? "19h";
  return `${date} · ${time}`;
}

export function ticketTypeName(ticket?: TicketWithDetails | null) {
  return ticket?.ticket_types?.name ?? "Ingresso do reencontro";
}

export function ticketPaymentStatus(ticket?: TicketWithDetails | null) {
  return ticket?.orders?.payment_status ?? "pending";
}
