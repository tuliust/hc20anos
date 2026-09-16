import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br").replace(/\/$/, "");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "600",
};

const CLIENT_CODES = new Set([
  "authentication_required","buyer_user_mismatch","buyer_name_required","buyer_email_invalid",
  "idempotency_key_required","participants_must_be_array","participant_limit_exceeded",
  "participant_client_key_invalid","participant_client_key_duplicate","participant_type_invalid",
  "participant_name_required","exactly_one_alumni_required","spouse_limit_exceeded",
  "child_birth_date_required","child_birth_date_invalid","unsupported_primary_product",
  "invalid_primary_product","alumni_registration_required","extras_not_supported",
  "lot_capacity_exceeded","no_active_lot","checkout_idempotency_expired","checkout_environment_conflict"
]);

type Participant = {
  client_key: string;
  participant_type: "alumni" | "spouse" | "child";
  full_name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  relationship_to_alumni?: string | null;
  person_id?: string | null;
  user_id?: string | null;
};

type RequestBody = {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  product_code: "simple";
  participants: Participant[];
  extras?: unknown[];
  idempotency_key: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function env() {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) throw new Error("server_configuration_missing");
  const mpEnv = Deno.env.get("MERCADO_PAGO_ENV") ?? "test";
  if (mpEnv !== "test" && mpEnv !== "production") throw new Error("mercado_pago_environment_invalid");
  return { url, anon, service, mpEnv: mpEnv as "test" | "production" };
}

function functionBaseUrl(url: string) {
  return (Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? Deno.env.get("FUNCTIONS_PUBLIC_URL") ?? `${url}/functions/v1`).replace(/\/$/, "");
}

function returnUrl(status: string, token: string) {
  const params = new URLSearchParams({ checkout: status, token });
  return `${SITE_URL}/?${params.toString()}`;
}

function consentUrl(url: string, token: string) {
  return `${functionBaseUrl(url)}/checkout-consent?token=${encodeURIComponent(token)}`;
}

function validate(body: RequestBody) {
  if (!body || typeof body !== "object") throw new Error("invalid_payload");
  if (!body.buyer_name?.trim()) throw new Error("buyer_name_required");
  if (!/^\S+@\S+\.\S+$/.test(body.buyer_email ?? "")) throw new Error("buyer_email_invalid");
  if (!body.idempotency_key?.trim() || body.idempotency_key.length > 160) throw new Error("idempotency_key_required");
  if (body.product_code !== "simple") throw new Error("unsupported_primary_product");
  if (!Array.isArray(body.participants)) throw new Error("participants_must_be_array");
  if (body.participants.length < 1 || body.participants.length > 6) throw new Error("participant_limit_exceeded");
  if (Array.isArray(body.extras) && body.extras.length) throw new Error("extras_not_supported");

  const keys = new Set<string>();
  let alumni = 0;
  let spouses = 0;
  for (const p of body.participants) {
    const key = p.client_key?.trim();
    if (!key) throw new Error("participant_client_key_invalid");
    if (keys.has(key)) throw new Error("participant_client_key_duplicate");
    keys.add(key);
    if (!["alumni","spouse","child"].includes(p.participant_type)) throw new Error("participant_type_invalid");
    if (!p.full_name?.trim()) throw new Error("participant_name_required");
    if (p.participant_type === "alumni") alumni += 1;
    if (p.participant_type === "spouse") spouses += 1;
    if (p.participant_type === "child") {
      if (!p.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(p.birth_date)) throw new Error("child_birth_date_required");
      const date = new Date(`${p.birth_date}T12:00:00Z`);
      if (Number.isNaN(date.getTime())) throw new Error("child_birth_date_invalid");
    }
  }
  if (alumni !== 1) throw new Error("exactly_one_alumni_required");
  if (spouses > 1) throw new Error("spouse_limit_exceeded");
}

function errorCode(error: unknown) {
  const msg = error instanceof Error ? error.message : String((error as any)?.message ?? error ?? "");
  for (const code of CLIENT_CODES) if (msg.includes(code)) return code;
  return null;
}

async function clients(request: Request) {
  const cfg = env();
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("authentication_required");
  const userDb = createClient(cfg.url, cfg.anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userDb.auth.getUser();
  if (error || !data.user) throw new Error("authentication_required");
  const serviceDb = createClient(cfg.url, cfg.service, { auth: { persistSession: false, autoRefreshToken: false } });
  return { ...cfg, authorization, user: data.user, userDb, serviceDb };
}

function usablePreference(row: any) {
  if (!row?.checkout_url) return false;
  if (!row.expires_at) return true;
  const expires = Date.parse(row.expires_at);
  return Number.isFinite(expires) && expires > Date.now();
}

async function createPreference(params: { accessToken: string; environment: "test" | "production"; url: string; order: any; participants: Participant[] }) {
  const { accessToken, environment, url, order, participants } = params;
  const now = new Date();
  const preferenceBody = {
    items: [{
      id: `order-${order.id}`,
      title: "HC 20 Anos — Ingressos",
      quantity: 1,
      unit_price: Number(order.total_amount_cents) / 100,
      currency_id: "BRL",
    }],
    payer: {
      name: order.buyer_name,
      email: order.buyer_email,
      phone: order.buyer_phone ? { number: order.buyer_phone } : undefined,
    },
    external_reference: order.id,
    metadata: {
      public_token: order.public_token,
      lot_code: order.ticket_lots?.code ?? "single",
      participant_count: participants.length,
    },
    back_urls: {
      success: returnUrl("approved", order.public_token),
      failure: returnUrl("rejected", order.public_token),
      pending: returnUrl("pending", order.public_token),
    },
    auto_return: "approved",
    notification_url: `${functionBaseUrl(url)}/payment-webhook`,
    statement_descriptor: "TURMA2006HC",
    expires: true,
    expiration_date_from: now.toISOString(),
    expiration_date_to: order.expires_at,
    payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 3 },
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": `hc20-${order.id}-${environment}`,
    },
    body: JSON.stringify(preferenceBody),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("[checkout-create] Mercado Pago preference failed", response.status, detail.slice(0, 1000));
    throw new Error("mercado_pago_preference_failed");
  }
  return response.json();
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const ctx = await clients(request);
    if (request.method === "GET") {
      return json({ environment: ctx.mpEnv, checkout_mode: ctx.mpEnv === "test" ? "sandbox" : "production", provider_configured: Boolean(Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")), consent_gate: true });
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")?.trim();
    if (!accessToken) return json({ error: "mercado_pago_not_configured" }, 503);

    const body = await request.json() as RequestBody;
    validate(body);

    const { data: rows, error: orderError } = await ctx.userDb.rpc("create_checkout_order", {
      p_buyer_user_id: ctx.user.id,
      p_buyer_name: body.buyer_name,
      p_buyer_email: body.buyer_email,
      p_buyer_phone: body.buyer_phone ?? null,
      p_product_code: "simple",
      p_participants: body.participants,
      p_extras: [],
      p_idempotency_key: body.idempotency_key,
    });
    if (orderError) {
      console.error("[checkout-create] order RPC failed", orderError);
      const code = errorCode(orderError) ?? "checkout_validation_failed";
      return json({ error: code }, CLIENT_CODES.has(code) ? 400 : 500);
    }
    const summary = Array.isArray(rows) ? rows[0] : rows;
    if (!summary?.order_id) return json({ error: "order_creation_failed" }, 500);

    const { data: order, error: fetchError } = await ctx.serviceDb
      .from("orders")
      .select("id,public_token,buyer_name,buyer_email,buyer_phone,total_amount_cents,expires_at,payment_status,reservation_status,payment_environment,ticket_lots(code,name)")
      .eq("id", summary.order_id)
      .single();
    if (fetchError || !order) return json({ error: "order_not_found_after_creation" }, 500);

    if (order.payment_status !== "pending" || order.reservation_status !== "active" || !order.expires_at || Date.parse(order.expires_at) <= Date.now()) {
      return json({ error: "checkout_idempotency_expired" }, 409);
    }

    const publicConsentUrl = consentUrl(ctx.url, order.public_token);
    const { data: existing, error: prefReadError } = await ctx.serviceDb
      .from("payment_preferences")
      .select("order_id,checkout_url,expires_at,environment,provider_preference_id")
      .eq("order_id", order.id)
      .eq("status", "active")
      .maybeSingle();
    if (prefReadError) throw prefReadError;
    if (existing) {
      if (existing.environment !== ctx.mpEnv) return json({ error: "checkout_environment_conflict" }, 409);
      if (usablePreference(existing)) return json({ checkout_url: publicConsentUrl, public_token: order.public_token, expires_at: existing.expires_at, reused_preference: true, consent_required: true });
      await ctx.serviceDb.from("payment_preferences").update({ status: "expired" }).eq("order_id", order.id).eq("status", "active");
    }

    const preference = await createPreference({ accessToken, environment: ctx.mpEnv, url: ctx.url, order, participants: body.participants });
    const checkoutUrl = ctx.mpEnv === "test" ? preference.sandbox_init_point : preference.init_point;
    if (!checkoutUrl) throw new Error("mercado_pago_checkout_url_missing");

    const { error: insertError } = await ctx.serviceDb.from("payment_preferences").insert({
      order_id: order.id,
      provider: "mercadopago",
      provider_preference_id: preference.id,
      environment: ctx.mpEnv,
      checkout_url: checkoutUrl,
      status: "active",
      expires_at: order.expires_at,
    });
    if (insertError) {
      if ((insertError as any).code === "23505") {
        const { data: concurrent } = await ctx.serviceDb.from("payment_preferences")
          .select("checkout_url,expires_at,environment").eq("order_id", order.id).eq("status", "active").maybeSingle();
        if (concurrent && concurrent.environment === ctx.mpEnv && usablePreference(concurrent)) {
          return json({ checkout_url: publicConsentUrl, public_token: order.public_token, expires_at: concurrent.expires_at, reused_preference: true, consent_required: true });
        }
      }
      throw insertError;
    }

    const { error: updateError } = await ctx.serviceDb.from("orders").update({
      payment_provider_preference_id: preference.id,
      payment_environment: ctx.mpEnv,
    }).eq("id", order.id);
    if (updateError) throw updateError;

    return json({ checkout_url: publicConsentUrl, public_token: order.public_token, expires_at: order.expires_at, reused_preference: false, consent_required: true }, 201);
  } catch (error) {
    console.error("[checkout-create] unexpected error", error);
    const code = errorCode(error);
    if (code) return json({ error: code }, code === "authentication_required" || code === "buyer_user_mismatch" ? 401 : 400);
    const message = error instanceof Error ? error.message : "internal_error";
    if (["mercado_pago_preference_failed","mercado_pago_checkout_url_missing","mercado_pago_environment_invalid","server_configuration_missing"].includes(message)) return json({ error: message }, 503);
    return json({ error: "internal_error" }, 500);
  }
});
