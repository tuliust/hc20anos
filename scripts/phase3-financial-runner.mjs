import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const required = [
  "PHASE3_SUPABASE_URL",
  "PHASE3_SUPABASE_ANON_KEY",
  "PHASE3_BUYER_EMAIL",
  "PHASE3_BUYER_PASSWORD",
  "PHASE3_CHECKOUT_PAYLOAD_JSON",
  "PHASE3_IDEMPOTENCY_KEY_OVERRIDE",
];

const missing = required.filter((name) => !String(process.env[name] ?? "").trim());
if (missing.length > 0) {
  throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
}

const url = String(process.env.PHASE3_SUPABASE_URL).replace(/\/$/, "");
const anonKey = String(process.env.PHASE3_SUPABASE_ANON_KEY);
const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
  email: String(process.env.PHASE3_BUYER_EMAIL),
  password: String(process.env.PHASE3_BUYER_PASSWORD),
});
if (signInError || !signIn.session?.access_token) {
  throw new Error(`Falha ao autenticar comprador no guard: ${signInError?.message ?? "sessão ausente"}`);
}

const response = await fetch(`${url}/functions/v1/checkout-create`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${signIn.session.access_token}`,
    apikey: anonKey,
    Origin: "https://hc20anos.com.br",
  },
});
const text = await response.text();
let health;
try {
  health = text ? JSON.parse(text) : {};
} catch {
  throw new Error(`Guard de ambiente retornou resposta não JSON (${response.status})`);
}
if (!response.ok) {
  throw new Error(`Guard de ambiente indisponível (${response.status}: ${health?.error ?? "erro_desconhecido"})`);
}
if (health.environment !== "test" || health.checkout_mode !== "sandbox") {
  throw new Error(`Execução bloqueada: checkout remoto está em ${health.environment ?? "ambiente_desconhecido"}`);
}
if (health.provider_configured !== true) {
  throw new Error("Execução bloqueada: provedor de pagamento não configurado");
}

let payload;
try {
  payload = JSON.parse(String(process.env.PHASE3_CHECKOUT_PAYLOAD_JSON));
} catch {
  throw new Error("PHASE3_CHECKOUT_PAYLOAD_JSON não é JSON válido");
}
payload.idempotency_key = String(process.env.PHASE3_IDEMPOTENCY_KEY_OVERRIDE);
process.env.PHASE3_CHECKOUT_PAYLOAD_JSON = JSON.stringify(payload);
process.env.PHASE3_CONFIRMED_ENVIRONMENT = "test";

await client.auth.signOut();
console.log(JSON.stringify({
  status: "environment_confirmed",
  environment: "test",
  checkout_mode: "sandbox",
  provider_configured: true,
  financial_mutations_performed: false,
}));

await import("./phase3-financial-execution.mjs");
