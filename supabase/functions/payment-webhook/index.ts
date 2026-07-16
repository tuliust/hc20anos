import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_SITE_URL = "https://hc20anos.com.br";
const MAX_SIGNATURE_AGE_SECONDS = 15 * 60;

function corsHeaders(request: Request): HeadersInit {
  const configuredOrigin = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const requestOrigin = request.headers.get("Origin")?.replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": requestOrigin === configuredOrigin ? requestOrigin : configuredOrigin,
    "Access-Control-Allow-Headers": "content-type,x-signature,x-request-id",
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const signature = await validateSignature(request, url, body);
  if (!signature.valid) {
    console.warn("payment_webhook_invalid_signature", signature.reason);
    return json(request, { error: "invalid_signature" }, 401);
  }

  const paymentId = normalizeDataId(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body?.id);
  const eventType = String(body?.type ?? body?.action ?? "unknown");
  const action = String(body?.action ?? "");
  const providerEventId = [eventType, action, paymentId, signature.requestId].filter(Boolean).join(":");
  const db = adminClient();

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

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")?.trim();
  if (!accessToken) {
    await db.from("payment_events")
      .update({ processing_status: "failed", processing_error: "missing_access_token" })
      .eq("id", eventRow.id);
    return json(request, { error: "temporary_processing_failure" }, 503);
  }

  try {
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!paymentResponse.ok) {
      const detail = await paymentResponse.text();
      throw new Error(`payment_fetch_${paymentResponse.status}:${detail.slice(0, 500)}`);
    }

    const payment = await paymentResponse.json();
    if (String(payment.id) !== paymentId) throw new Error("payment_id_mismatch");

    const orderId = String(payment.external_reference ?? "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
      throw new Error("missing_or_invalid_external_reference");
    }

    const transactionAmount = Number(payment.transaction_amount);
    if (!Number.isFinite(transactionAmount) || transactionAmount < 0) throw new Error("invalid_transaction_amount");
    const amountCents = Math.round(transactionAmount * 100);
    const paidAt = payment.date_approved ? new Date(payment.date_approved).toISOString() : null;

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
      p_preference_id: payment.preference_id ? String(payment.preference_id) : null,
      p_paid_at: paidAt,
    });
    if (applyError) throw applyError;

    await db.from("payment_events").update({
      order_id: orderId,
      processing_status: "processed",
      processing_error: null,
      processed_at: new Date().toISOString(),
    }).eq("id", eventRow.id);

    return json(request, { received: true, result: result?.[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("payment_webhook_failed", error);
    await db.from("payment_events").update({
      processing_status: "failed",
      processing_error: message.slice(0, 1000),
    }).eq("id", eventRow.id);
    return json(request, { error: "temporary_processing_failure" }, 503);
  }
});
