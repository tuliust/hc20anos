import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const required = [
  "PHASE3_SUPABASE_URL",
  "PHASE3_SUPABASE_ANON_KEY",
  "PHASE3_BUYER_EMAIL",
  "PHASE3_BUYER_PASSWORD",
  "PHASE3_ADMIN_EMAIL",
  "PHASE3_ADMIN_PASSWORD",
];

const missing = required.filter((name) => !String(process.env[name] ?? "").trim());
if (missing.length) throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);

const url = String(process.env.PHASE3_SUPABASE_URL).replace(/\/$/, "");
const anonKey = String(process.env.PHASE3_SUPABASE_ANON_KEY);
const buyerEmail = String(process.env.PHASE3_BUYER_EMAIL).trim().toLowerCase();

function normalize(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

function ticketSummary(order) {
  const participants = Array.isArray(order?.participants) ? order.participants : [];
  const tickets = participants.map((p) => p?.ticket).filter(Boolean);
  return {
    participant_count: participants.length,
    ticket_count: tickets.length,
    ticket_statuses: [...new Set(tickets.map((t) => t?.status).filter(Boolean))],
    checked_in_count: tickets.filter((t) => t?.checked_in === true).length,
  };
}

const buyer = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const { data: buyerSignIn, error: buyerSignInError } = await buyer.auth.signInWithPassword({
  email: buyerEmail,
  password: String(process.env.PHASE3_BUYER_PASSWORD),
});
if (buyerSignInError || !buyerSignIn.user) throw new Error(`Falha ao autenticar comprador: ${buyerSignInError?.message ?? "sessão ausente"}`);

const { data: buyerOrdersRaw, error: buyerOrdersError } = await buyer.rpc("get_my_commerce_orders");
if (buyerOrdersError) throw new Error(`get_my_commerce_orders falhou: ${buyerOrdersError.message}`);
const buyerOrders = normalize(buyerOrdersRaw);
const buyerOrder = buyerOrders.find((o) => o?.ticket_type?.product_code === "simple" && Number(o?.total_amount_cents) === 25000) ?? buyerOrders[0] ?? null;
await buyer.auth.signOut();

const admin = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const { data: adminSignIn, error: adminSignInError } = await admin.auth.signInWithPassword({
  email: String(process.env.PHASE3_ADMIN_EMAIL),
  password: String(process.env.PHASE3_ADMIN_PASSWORD),
});
if (adminSignInError || !adminSignIn.user) throw new Error(`Falha ao autenticar admin: ${adminSignInError?.message ?? "sessão ausente"}`);

const { data: adminOrdersRaw, error: adminOrdersError } = await admin.rpc("get_admin_orders", { p_status: null });
if (adminOrdersError) throw new Error(`get_admin_orders falhou: ${adminOrdersError.message}`);
const adminOrders = normalize(adminOrdersRaw);
const adminOrder = adminOrders.find((o) => String(o?.buyer_email ?? "").trim().toLowerCase() === buyerEmail && Number(o?.total_amount_cents) === 25000) ?? null;
await admin.auth.signOut();

const ticket = ticketSummary(buyerOrder);
const report = {
  status: "ok",
  mode: "read_only",
  financial_mutations_performed: false,
  payment_status: adminOrder?.payment_status ?? buyerOrder?.payment_status ?? null,
  payment_status_detail: buyerOrder?.payment_status_detail ?? null,
  payment_environment: adminOrder?.payment_environment ?? null,
  reservation_status: adminOrder?.reservation_status ?? buyerOrder?.reservation_status ?? null,
  preference_status: adminOrder?.preference_status ?? null,
  webhook_events: Number(adminOrder?.webhook_events ?? 0),
  webhook_failures: Number(adminOrder?.webhook_failures ?? 0),
  paid_at_present: Boolean(buyerOrder?.paid_at),
  participant_count: ticket.participant_count,
  ticket_count: ticket.ticket_count,
  ticket_statuses: ticket.ticket_statuses,
  checked_in_count: ticket.checked_in_count,
};

await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/phase3-payment-readonly-check.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report));
