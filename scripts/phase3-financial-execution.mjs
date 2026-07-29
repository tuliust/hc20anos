import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const REQUIRED = [
  "PHASE3_SUPABASE_URL",
  "PHASE3_SUPABASE_ANON_KEY",
  "PHASE3_BUYER_EMAIL",
  "PHASE3_BUYER_PASSWORD",
  "PHASE3_CHECKOUT_PAYLOAD_JSON",
];

const FORBIDDEN_FINANCIAL_FIELDS = [
  "price",
  "unit_price",
  "total",
  "total_amount",
  "total_amount_cents",
  "ticket_type_id",
];

function fail(message, detail = undefined) {
  const error = new Error(message);
  if (detail !== undefined) error.detail = detail;
  throw error;
}

function requiredEnvironment() {
  const missing = REQUIRED.filter((name) => !String(process.env[name] ?? "").trim());
  if (missing.length > 0) fail(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);

  const url = String(process.env.PHASE3_SUPABASE_URL).replace(/\/$/, "");
  if (!/^https:\/\//i.test(url)) fail("PHASE3_SUPABASE_URL deve usar HTTPS");

  return {
    url,
    anonKey: String(process.env.PHASE3_SUPABASE_ANON_KEY),
    buyerEmail: String(process.env.PHASE3_BUYER_EMAIL).trim().toLowerCase(),
    buyerPassword: String(process.env.PHASE3_BUYER_PASSWORD),
    expectedTotalCents: Number(process.env.PHASE3_EXPECTED_TOTAL_CENTS ?? "25000"),
  };
}

function parsePayload(expectedBuyerEmail) {
  let payload;
  try {
    payload = JSON.parse(String(process.env.PHASE3_CHECKOUT_PAYLOAD_JSON));
  } catch {
    fail("PHASE3_CHECKOUT_PAYLOAD_JSON não é JSON válido");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail("Payload de checkout inválido");
  const leakedFields = FORBIDDEN_FINANCIAL_FIELDS.filter((field) => Object.hasOwn(payload, field));
  if (leakedFields.length > 0) fail(`Payload contém autoridade financeira proibida: ${leakedFields.join(", ")}`);
  if (String(payload.buyer_email ?? "").trim().toLowerCase() !== expectedBuyerEmail) {
    fail("buyer_email do payload diverge de PHASE3_BUYER_EMAIL");
  }
  if (payload.product_code !== "simple") fail("A primeira execução integrada exige product_code=simple");
  if (!Array.isArray(payload.participants) || payload.participants.length !== 1) {
    fail("A primeira execução integrada exige exatamente um participante");
  }
  if (payload.participants[0]?.participant_type !== "alumni") {
    fail("O participante da primeira execução deve ser alumni");
  }
  if (!Array.isArray(payload.extras) || payload.extras.length !== 0) {
    fail("A primeira execução integrada não permite extras");
  }
  if (!String(payload.idempotency_key ?? "").trim()) fail("idempotency_key ausente no payload");

  return payload;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    fail(`Resposta não JSON do checkout-create (${response.status})`);
  }
  return body;
}

async function callCheckout({ url, anonKey, accessToken, payload }) {
  const response = await fetch(`${url}/functions/v1/checkout-create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json",
      Origin: "https://hc20anos.com.br",
      "Idempotency-Key": payload.idempotency_key,
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) fail(`checkout-create retornou HTTP ${response.status}: ${body?.error ?? "erro_desconhecido"}`);
  if (!body.checkout_url || !body.public_token || !body.expires_at) fail("checkout-create retornou contrato incompleto");
  return { status: response.status, body };
}

function assertSandboxCheckout(checkoutUrl) {
  const parsed = new URL(checkoutUrl);
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname.includes("sandbox") || !hostname.includes("mercadopago")) {
    fail(`Checkout não identificado como sandbox: ${hostname}`);
  }
  return hostname;
}

function normalizedOrders(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  const startedAt = new Date().toISOString();
  const env = requiredEnvironment();
  const payload = parsePayload(env.buyerEmail);

  const supabase = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: env.buyerEmail,
    password: env.buyerPassword,
  });
  if (signInError || !signIn.session?.access_token || !signIn.user) {
    fail(`Falha ao autenticar comprador: ${signInError?.message ?? "sessão ausente"}`);
  }
  if (String(signIn.user.email ?? "").toLowerCase() !== env.buyerEmail) fail("Sessão autenticada diverge do comprador esperado");

  const first = await callCheckout({
    url: env.url,
    anonKey: env.anonKey,
    accessToken: signIn.session.access_token,
    payload,
  });
  const checkoutHost = assertSandboxCheckout(first.body.checkout_url);

  const second = await callCheckout({
    url: env.url,
    anonKey: env.anonKey,
    accessToken: signIn.session.access_token,
    payload,
  });
  assertSandboxCheckout(second.body.checkout_url);

  if (second.body.reused_preference !== true) fail("A segunda chamada não reutilizou a preferência");
  if (first.body.checkout_url !== second.body.checkout_url) fail("A URL de checkout mudou na repetição idempotente");
  if (first.body.public_token !== second.body.public_token) fail("O public_token mudou na repetição idempotente");
  if (first.body.expires_at !== second.body.expires_at) fail("A expiração mudou na repetição idempotente");

  const { data: commerceOrders, error: ordersError } = await supabase.rpc("get_my_commerce_orders");
  if (ordersError) fail(`get_my_commerce_orders falhou: ${ordersError.message}`);
  const orders = normalizedOrders(commerceOrders);
  const order = orders.find((item) => item?.public_token === first.body.public_token);
  if (!order) fail("Pedido criado não apareceu em get_my_commerce_orders");
  if (order.ticket_type?.product_code !== "simple") fail("Pedido criado não usa o produto simple");
  if (Number(order.total_amount_cents) !== env.expectedTotalCents) {
    fail(`Total autoritativo inesperado: ${order.total_amount_cents}`);
  }
  if (order.payment_status === "approved") fail("Pedido foi aprovado sem pagamento de teste");
  if (order.reservation_status !== "active") fail(`Reserva inesperada: ${order.reservation_status}`);
  if (!Array.isArray(order.participants) || order.participants.length !== 1) {
    fail("Pedido não possui exatamente um participante");
  }

  const emailHash = createHash("sha256").update(env.buyerEmail).digest("hex").slice(0, 16);
  const sanitizedReport = {
    status: "passed",
    stage: "checkout_preference_idempotency",
    environment: "test",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    network_calls_performed: true,
    payment_executed: false,
    buyer_email_sha256_prefix: emailHash,
    checkout_host: checkoutHost,
    first_http_status: first.status,
    second_http_status: second.status,
    first_reused_preference: Boolean(first.body.reused_preference),
    second_reused_preference: Boolean(second.body.reused_preference),
    same_checkout_url: true,
    same_public_token: true,
    order: {
      id: order.id,
      public_token: order.public_token,
      product_code: order.ticket_type?.product_code,
      payment_status: order.payment_status,
      reservation_status: order.reservation_status,
      total_amount_cents: order.total_amount_cents,
      currency_id: order.currency_id,
      participant_count: order.participants.length,
      expires_at: order.expires_at,
    },
  };

  const privateSession = {
    checkout_url: first.body.checkout_url,
    public_token: first.body.public_token,
    expires_at: first.body.expires_at,
    idempotency_key: payload.idempotency_key,
    payment_executed: false,
  };

  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/phase3-checkout-idempotency.json", `${JSON.stringify(sanitizedReport, null, 2)}\n`, "utf8");
  await writeFile("artifacts/phase3-checkout-session.private.json", `${JSON.stringify(privateSession, null, 2)}\n`, "utf8");

  await supabase.auth.signOut();
  console.log(JSON.stringify({
    status: sanitizedReport.status,
    stage: sanitizedReport.stage,
    payment_executed: false,
    checkout_host: checkoutHost,
    first_reused_preference: sanitizedReport.first_reused_preference,
    second_reused_preference: sanitizedReport.second_reused_preference,
    report: "artifacts/phase3-checkout-idempotency.json",
    private_session_artifact: "artifacts/phase3-checkout-session.private.json",
  }));
}

main().catch(async (error) => {
  await mkdir("artifacts", { recursive: true });
  const report = {
    status: "failed",
    stage: "checkout_preference_idempotency",
    completed_at: new Date().toISOString(),
    payment_executed: false,
    error: error instanceof Error ? error.message : String(error),
  };
  await writeFile("artifacts/phase3-checkout-idempotency.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(report.error);
  process.exitCode = 1;
});
