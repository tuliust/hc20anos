import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_SITE_URL = "https://hc20anos.com.br";
const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const CLIENT_ERROR_CODES = new Set([
  "invalid_payload",
  "authentication_required",
  "buyer_name_required",
  "buyer_email_invalid",
  "idempotency_key_required",
  "participants_must_be_array",
  "extras_must_be_array",
  "participant_limit_exceeded",
  "participant_client_key_invalid",
  "participant_client_key_duplicate",
  "participant_type_invalid",
  "participant_name_required",
  "exactly_one_alumni_required",
  "invalid_primary_product",
  "unsupported_primary_product",
  "simple_package_invalid_composition",
  "family_full_invalid_composition",
  "family_single_parent_invalid_composition",
  "external_guest_package_invalid_composition",
  "child_birth_date_required",
  "child_birth_date_invalid",
  "child_birth_date_future",
  "external_guest_data_required",
  "external_guest_not_approved",
  "invalid_extra",
  "invalid_extra_quantity",
  "extra_participant_not_found",
  "no_active_lot",
  "additional_child_price_missing",
  "external_guest_price_missing",
  "extra_price_missing",
]);

const SERVER_ERROR_CODES = new Set([
  "mercado_pago_not_configured",
  "mercado_pago_preference_failed",
  "mercado_pago_checkout_url_missing",
  "order_creation_failed",
  "order_not_found_after_creation",
]);

type CheckoutParticipant = {
  client_key: string;
  participant_type: "alumni" | "spouse" | "child" | "external_guest";
  full_name: string;
  user_id?: string | null;
  person_id?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  relationship_to_alumni?: string | null;
  sponsor_person_id?: string | null;
  sponsor_user_id?: string | null;
};

type CheckoutExtra = {
  participant_key: string;
  extra_type: "drinks" | "barbecue";
  quantity: number;
};

type CheckoutRequest = {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  product_code: "simple" | "family_full" | "family_single_parent" | "external_guest";
  participants: CheckoutParticipant[];
  extras?: CheckoutExtra[];
  idempotency_key: string;
};

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function configuredOrigins() {
  const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const extras = (Deno.env.get("CHECKOUT_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([siteUrl, ...extras, ...LOCAL_ORIGINS]);
}

function allowedOrigin(request: Request) {
  const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const origin = request.headers.get("Origin")?.replace(/\/$/, "");
  if (!origin) return siteUrl;
  return configuredOrigins().has(origin) ? origin : siteUrl;
}

function corsHeaders(request: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(request),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function assertEnvironment() {
  const environment = Deno.env.get("MERCADO_PAGO_ENV") ?? "test";
  if (environment !== "test" && environment !== "production") {
    throw new Error("mercado_pago_environment_invalid");
  }
  return environment;
}

function functionBaseUrl() {
  const explicit = Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? Deno.env.get("FUNCTIONS_PUBLIC_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!explicit && !supabaseUrl) throw new Error("functions_public_url_missing");
  return (explicit ?? `${supabaseUrl}/functions/v1`).replace(/\/$/, "");
}

function checkoutReturnUrl(status: string, publicToken: string) {
  const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const params = new URLSearchParams({ checkout: status, token: publicToken });
  return `${siteUrl}/?${params.toString()}`;
}

function validateBody(body: CheckoutRequest) {
  if (!body || typeof body !== "object") throw new Error("invalid_payload");
  if (!body.buyer_name?.trim()) throw new Error("buyer_name_required");
  if (!/^\S+@\S+\.\S+$/.test(body.buyer_email ?? "")) throw new Error("buyer_email_invalid");
  if (!body.idempotency_key?.trim() || body.idempotency_key.length > 160) throw new Error("idempotency_key_required");
  if (!Array.isArray(body.participants)) throw new Error("participants_must_be_array");
  if (!Array.isArray(body.extras ?? [])) throw new Error("extras_must_be_array");
  if (body.participants.length < 1 || body.participants.length > 6) throw new Error("participant_limit_exceeded");

  const keys = new Set<string>();
  const participantTypes = new Set(["alumni", "spouse", "child", "external_guest"]);
  for (const participant of body.participants) {
    const participantKey = participant.client_key?.trim();
    if (!participantKey) throw new Error("participant_client_key_invalid");
    if (keys.has(participantKey)) throw new Error("participant_client_key_duplicate");
    keys.add(participantKey);
    if (!participantTypes.has(participant.participant_type)) throw new Error("participant_type_invalid");
    if (!participant.full_name?.trim()) throw new Error("participant_name_required");
    if (participant.participant_type === "child") {
      if (!participant.birth_date) throw new Error("child_birth_date_required");
      const birthDate = new Date(`${participant.birth_date}T00:00:00Z`);
      if (Number.isNaN(birthDate.getTime())) throw new Error("child_birth_date_invalid");
    }
  }

  const extraTypes = new Set(["drinks", "barbecue"]);
  const extraKeys = new Set<string>();
  for (const extra of body.extras ?? []) {
    if (!keys.has(extra.participant_key)) throw new Error("extra_participant_not_found");
    if (!extraTypes.has(extra.extra_type)) throw new Error("invalid_extra");
    if (!Number.isInteger(extra.quantity) || extra.quantity <= 0) throw new Error("invalid_extra_quantity");
    const dedupeKey = `${extra.participant_key}:${extra.extra_type}`;
    if (extraKeys.has(dedupeKey)) throw new Error("invalid_extra");
    extraKeys.add(dedupeKey);
  }
}

function extractErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as any)?.message ?? error ?? "");
  for (const code of [...CLIENT_ERROR_CODES, ...SERVER_ERROR_CODES]) {
    if (message.includes(code)) return code;
  }
  return null;
}

async function authenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

async function createPreference(params: {
  accessToken: string;
  environment: "test" | "production";
  order: any;
  participants: CheckoutParticipant[];
  extras: CheckoutExtra[];
}) {
  const { accessToken, environment, order, participants, extras } = params;
  const preferenceBody = {
    items: [{
      id: `order-${order.order_id}`,
      title: `Ingressos HC 20 Anos — ${order.lot_name}`,
      quantity: 1,
      unit_price: order.total_amount_cents / 100,
      currency_id: "BRL",
    }],
    payer: {
      name: order.buyer_name,
      email: order.buyer_email,
      phone: order.buyer_phone ? { number: order.buyer_phone } : undefined,
    },
    external_reference: order.order_id,
    metadata: {
      public_token: order.public_token,
      lot_code: order.lot_code,
      participant_count: participants.length,
      extras_count: extras.reduce((sum, item) => sum + item.quantity, 0),
    },
    back_urls: {
      success: checkoutReturnUrl("approved", order.public_token),
      failure: checkoutReturnUrl("rejected", order.public_token),
      pending: checkoutReturnUrl("pending", order.public_token),
    },
    auto_return: "approved",
    notification_url: `${functionBaseUrl()}/payment-webhook`,
    statement_descriptor: "TURMA2006HC",
    expires: true,
    expiration_date_to: order.expires_at,
    payment_methods: {
      excluded_payment_types: [{ id: "ticket" }],
      installments: 3,
    },
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "X-Idempotency-Key": `hc20-${order.order_id}-${environment}`,
    },
    body: JSON.stringify(preferenceBody),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("[checkout-create] Mercado Pago preference failed", response.status, detail.slice(0, 1000));
    throw new Error("mercado_pago_preference_failed");
  }
  return await response.json();
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);

  try {
    const user = await authenticatedUser(request);
    if (!user) return json({ error: "authentication_required" }, 401, headers);

    const environment = assertEnvironment();
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) return json({ error: "mercado_pago_not_configured" }, 503, headers);

    const body = await request.json() as CheckoutRequest;
    validateBody(body);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingPreference } = await db
      .from("payment_preferences")
      .select("order_id,checkout_url,expires_at,orders!inner(public_token,buyer_user_id,payment_status,reservation_status)")
      .eq("status", "active")
      .eq("orders.buyer_user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .eq("orders.checkout_idempotency_key", body.idempotency_key)
      .maybeSingle();

    if (existingPreference?.checkout_url) {
      return json({
        checkout_url: existingPreference.checkout_url,
        public_token: (existingPreference.orders as any)?.public_token,
        expires_at: existingPreference.expires_at,
        reused_preference: true,
      }, 200, headers);
    }

    const { data: rows, error: orderError } = await db.rpc("create_checkout_order", {
      p_buyer_user_id: user.id,
      p_buyer_name: body.buyer_name,
      p_buyer_email: body.buyer_email,
      p_buyer_phone: body.buyer_phone ?? null,
      p_product_code: body.product_code,
      p_participants: body.participants,
      p_extras: body.extras ?? [],
      p_idempotency_key: body.idempotency_key,
    });

    if (orderError) {
      console.error("[checkout-create] order RPC failed", orderError);
      const code = extractErrorCode(orderError);
      return json({ error: code ?? "checkout_validation_failed" }, code && CLIENT_ERROR_CODES.has(code) ? 400 : 500, headers);
    }

    const orderSummary = Array.isArray(rows) ? rows[0] : rows;
    if (!orderSummary?.order_id) return json({ error: "order_creation_failed" }, 500, headers);

    const { data: order, error: fetchError } = await db
      .from("orders")
      .select("id,public_token,buyer_name,buyer_email,buyer_phone,total_amount_cents,expires_at,lot_id,ticket_lots(code,name)")
      .eq("id", orderSummary.order_id)
      .single();
    if (fetchError || !order) return json({ error: "order_not_found_after_creation" }, 500, headers);

    const preference = await createPreference({
      accessToken,
      environment,
      order: {
        order_id: order.id,
        public_token: order.public_token,
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        buyer_phone: order.buyer_phone,
        total_amount_cents: order.total_amount_cents,
        expires_at: order.expires_at,
        lot_code: (order.ticket_lots as any)?.code ?? orderSummary.lot_code,
        lot_name: (order.ticket_lots as any)?.name ?? orderSummary.lot_name,
      },
      participants: body.participants,
      extras: body.extras ?? [],
    });

    const checkoutUrl = environment === "test" ? preference.sandbox_init_point : preference.init_point;
    if (!checkoutUrl) throw new Error("mercado_pago_checkout_url_missing");

    const { error: prefInsertError } = await db.from("payment_preferences").insert({
      order_id: order.id,
      provider: "mercadopago",
      provider_preference_id: preference.id,
      environment,
      checkout_url: checkoutUrl,
      status: "active",
      expires_at: order.expires_at,
    });
    if (prefInsertError) throw prefInsertError;

    const { error: updateError } = await db.from("orders").update({
      payment_provider_preference_id: preference.id,
      payment_environment: environment,
    }).eq("id", order.id);
    if (updateError) throw updateError;

    return json({
      checkout_url: checkoutUrl,
      public_token: order.public_token,
      expires_at: order.expires_at,
      reused_preference: false,
    }, 201, headers);
  } catch (error) {
    console.error("[checkout-create] unexpected error", error);
    const code = extractErrorCode(error);
    if (code && CLIENT_ERROR_CODES.has(code)) return json({ error: code }, 400, headers);
    if (code && SERVER_ERROR_CODES.has(code)) return json({ error: code }, 503, headers);
    return json({ error: "internal_error" }, 500, headers);
  }
});
