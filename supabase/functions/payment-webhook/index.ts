import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_SITE_URL = "https://hc20anos.com.br";
const MAX_SIGNATURE_AGE_SECONDS = 15 * 60;

function corsHeaders(request: Request): HeadersInit {
  const configuredOrigin = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const requestOrigin = request.headers.get("Origin")?.replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": requestOrigin === configuredOrigin ? requestOrigin : configuredOrigin,
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-signature,x-request-id",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function anonClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!token) throw new Error("authentication_required");

  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data.user) throw new Error("authentication_required");
  return data.user;
}

function parseSignature(value: string) {
  const parsed = new Map<string, string>();
  for (const part of value.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    parsed.set(part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim());
  }
  return parsed;
}

function normalizeDataId(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function hmacSha256Bytes(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function validateSignature(request: Request, url: URL, body: any) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")?.trim();
  if (!secret) return { valid: false, reason: "missing_webhook_secret" };

  const signature = parseSignature(request.headers.get("x-signature") ?? "");
  const requestId = request.headers.get("x-request-id")?.trim() ?? "";
  const timestamp = signature.get("ts") ?? "";
  const suppliedSignature = signature.get("v1") ?? "";
  const dataId = normalizeDataId(
    url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      body?.data?.id ??
      body?.id,
  );

  if (!requestId || !timestamp || !suppliedSignature || !dataId) {
    return { valid: false, reason: "signature_fields_missing" };
  }

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return { valid: false, reason: "signature_timestamp_invalid" };
  const timestampSeconds = timestampNumber > 10_000_000_000 ? Math.floor(timestampNumber / 1000) : Math.floor(timestampNumber);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MAX_SIGNATURE_AGE_SECONDS) {
    return { valid: false, reason: "signature_timestamp_expired" };
  }

  const suppliedBytes = hexToBytes(suppliedSignature);
  if (!suppliedBytes) return { valid: false, reason: "signature_format_invalid" };

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expectedBytes = await hmacSha256Bytes(secret, manifest);
  return {
    valid: timingSafeEqual(expectedBytes, suppliedBytes),
    reason: timingSafeEqual(expectedBytes, suppliedBytes) ? null : "signature_mismatch",
    dataId,
    requestId,
    timestamp,
  };
}

function isPaymentNotification(body: any) {
  const type = String(body?.type ?? "").toLowerCase();
  const action = String(body?.action ?? "").toLowerCase();
  return type === "payment" || action.startsWith("payment.");
}

function formatProcessingError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1000);
  if (typeof error === "string") return error.slice(0, 1000);

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const fields = [
      ["code", value.code],
      ["message", value.message],
      ["details", value.details],
      ["hint", value.hint],
      ["name", value.name],
    ]
      .filter(([, field]) => field !== null && field !== undefined && String(field).trim() !== "")
      .map(([key, field]) => `${key}=${String(field).trim()}`);

    if (fields.length) return fields.join(" | ").slice(0, 1000);
    return "structured_error_without_diagnostic_fields";
  }

  return String(error ?? "unknown_error").slice(0, 1000);
}

function mercadoPagoAccessToken() {
  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")?.trim();
  if (!accessToken) throw new Error("missing_access_token");
  return accessToken;
}

async function fetchMercadoPagoJson(path: string, errorPrefix: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${mercadoPagoAccessToken()}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${errorPrefix}_${response.status}:${detail.slice(0, 500)}`);
  }
  return await response.json();
}

async function fetchProviderPayment(paymentId: string) {
  const payment = await fetchMercadoPagoJson(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    "payment_fetch",
  );
  if (String(payment.id) !== paymentId) throw new Error("payment_id_mismatch");
  return payment;
}

function paymentOrderId(payment: any) {
  const orderId = String(payment?.external_reference ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new Error("missing_or_invalid_external_reference");
  }
  return orderId;
}

function merchantOrderContainsPayment(merchantOrder: any, paymentId: string) {
  return Array.isArray(merchantOrder?.payments) &&
    merchantOrder.payments.some((payment: any) => String(payment?.id ?? "") === paymentId);
}

function validateMerchantOrderForPayment(merchantOrder: any, orderId: string, paymentId: string) {
  if (String(merchantOrder?.external_reference ?? "").trim() !== orderId) {
    throw new Error("merchant_order_external_reference_mismatch");
  }
  if (!merchantOrderContainsPayment(merchantOrder, paymentId)) {
    throw new Error("merchant_order_payment_mismatch");
  }

  const preferenceId = String(merchantOrder?.preference_id ?? "").trim();
  if (!preferenceId) throw new Error("merchant_order_preference_required");
  return preferenceId;
}

async function resolveProviderPreferenceId(paymentId: string, payment: any) {
  const directPreferenceId = String(payment?.preference_id ?? "").trim();
  if (directPreferenceId) return directPreferenceId;

  const orderId = paymentOrderId(payment);
  const merchantOrderId = String(payment?.order?.id ?? "").trim();

  if (merchantOrderId) {
    const merchantOrder = await fetchMercadoPagoJson(
      `/merchant_orders/${encodeURIComponent(merchantOrderId)}`,
      "merchant_order_fetch",
    );
    return validateMerchantOrderForPayment(merchantOrder, orderId, paymentId);
  }

  const search = await fetchMercadoPagoJson(
    `/merchant_orders/search?external_reference=${encodeURIComponent(orderId)}&limit=50`,
    "merchant_order_search",
  );
  const matches = (Array.isArray(search?.elements) ? search.elements : []).filter(
    (merchantOrder: any) =>
      String(merchantOrder?.external_reference ?? "").trim() === orderId &&
      merchantOrderContainsPayment(merchantOrder, paymentId),
  );

  if (matches.length === 0) throw new Error("merchant_order_not_found_for_payment");
  if (matches.length > 1) throw new Error("merchant_order_ambiguous_for_payment");
  return validateMerchantOrderForPayment(matches[0], orderId, paymentId);
}

async function applyProviderPayment(db: ReturnType<typeof adminClient>, paymentId: string, payment: any) {
  const orderId = paymentOrderId(payment);
  const transactionAmount = Number(payment.transaction_amount);
  if (!Number.isFinite(transactionAmount) || transactionAmount < 0) throw new Error("invalid_transaction_amount");
  const amountCents = Math.round(transactionAmount * 100);
  const paidAt = payment.date_approved ? new Date(payment.date_approved).toISOString() : null;
  const preferenceId = await resolveProviderPreferenceId(paymentId, payment);

  const { data: result, error: applyError } = await db.rpc("apply_mercado_pago_payment", {
    p_order_id: orderId,
    p_payment_id: String(payment.id),
    p_payment_status: String(payment.status ?? "pending"),
    p_status_detail: payment.status_detail ? String(payment.status_detail) : null,
    p_payment_method: payment.payment_method_id ? String(payment.payment_method_id) : null,
    p_payment_type: payment.payment_type_id ? String(payment.payment_type_id) : null,
    p_installments: Number.isInteger(payment.installments) ? payment.installments : null,
    p_transaction_amount_cents: amountCents,
    p_currency_id: String(payment.currency_id ?? ""),
    p_preference_id: preferenceId,
    p_paid_at: paidAt,
  });
  if (applyError) throw applyError;

  return { orderId, result: result?.[0] ?? null };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const db = adminClient();
  const reconciliationPaymentId = normalizeDataId(body?.reconcile_payment_id);

  if (reconciliationPaymentId) {
    try {
      const user = await authenticatedUser(request);
      const payment = await fetchProviderPayment(reconciliationPaymentId);
      const orderId = paymentOrderId(payment);

      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id,buyer_user_id,public_token")
        .eq("id", orderId)
        .single();
      if (orderError || !order) throw new Error("order_not_found");
      if (order.buyer_user_id !== user.id) {
        const { data: admin } = await db
          .from("admin_users")
          .select("id")
          .eq("user_id", user.id)
          .in("role", ["admin", "superadmin"])
          .maybeSingle();
        if (!admin) return json(request, { error: "forbidden" }, 403);
      }

      const suppliedToken = String(body?.public_token ?? "").trim();
      if (suppliedToken && suppliedToken !== String(order.public_token)) {
        return json(request, { error: "public_token_mismatch" }, 403);
      }

      const providerEventId = `reconcile:${reconciliationPaymentId}:${orderId}`;
      const { data: eventRow, error: eventInsertError } = await db
        .from("payment_events")
        .insert({
          provider: "mercadopago",
          provider_event_id: providerEventId,
          payment_id: reconciliationPaymentId,
          order_id: orderId,
          event_type: "authenticated_reconciliation",
          payload_json: { source: "buyer_return", payment_id: reconciliationPaymentId },
          signature_valid: null,
          processing_status: "received",
          attempt_count: 1,
        })
        .select("id")
        .single();

      if (eventInsertError && eventInsertError.code !== "23505") throw eventInsertError;

      const applied = await applyProviderPayment(db, reconciliationPaymentId, payment);
      if (eventRow?.id) {
        await db.from("payment_events").update({
          processing_status: "processed",
          processing_error: null,
          processed_at: new Date().toISOString(),
        }).eq("id", eventRow.id);
      }

      return json(request, { reconciled: true, result: applied.result });
    } catch (error) {
      const message = formatProcessingError(error);
      console.error("payment_reconciliation_failed", message);
      if (message === "authentication_required") return json(request, { error: "authentication_required" }, 401);
      if (message === "order_not_found") return json(request, { error: "order_not_found" }, 404);
      return json(request, { error: "reconciliation_failed" }, 502);
    }
  }

  const signature = await validateSignature(request, url, body);
  if (!signature.valid) {
    console.warn("payment_webhook_invalid_signature", signature.reason);
    return json(request, { error: "invalid_signature" }, 401);
  }

  const paymentId = normalizeDataId(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body?.id);
  const eventType = String(body?.type ?? body?.action ?? "unknown");
  const action = String(body?.action ?? "");
  const providerEventId = [eventType, action, paymentId, signature.requestId].filter(Boolean).join(":");

  const { data: eventRow, error: eventInsertError } = await db
    .from("payment_events")
    .insert({
      provider: "mercadopago",
      provider_event_id: providerEventId,
      payment_id: paymentId || null,
      event_type: eventType,
      payload_json: body,
      signature_valid: true,
      processing_status: "received",
      attempt_count: 1,
    })
    .select("id")
    .single();

  if (eventInsertError) {
    if (eventInsertError.code === "23505") return json(request, { received: true, duplicate: true });
    console.error("payment_event_insert_failed", eventInsertError);
    return json(request, { error: "temporary_processing_failure" }, 503);
  }

  if (!paymentId || !isPaymentNotification(body)) {
    await db.from("payment_events")
      .update({ processing_status: "ignored", processed_at: new Date().toISOString() })
      .eq("id", eventRow.id);
    return json(request, { received: true, ignored: true });
  }

  try {
    const payment = await fetchProviderPayment(paymentId);
    const applied = await applyProviderPayment(db, paymentId, payment);

    await db.from("payment_events").update({
      order_id: applied.orderId,
      processing_status: "processed",
      processing_error: null,
      processed_at: new Date().toISOString(),
    }).eq("id", eventRow.id);

    return json(request, { received: true, result: applied.result });
  } catch (error) {
    const message = formatProcessingError(error);
    console.error("payment_webhook_failed", message);
    await db.from("payment_events").update({
      processing_status: "failed",
      processing_error: message,
    }).eq("id", eventRow.id);
    return json(request, { error: "temporary_processing_failure" }, 503);
  }
});
