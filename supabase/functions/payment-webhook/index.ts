import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br",
  "Access-Control-Allow-Headers": "content-type,x-signature,x-request-id",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateSignature(req: Request, url: URL, body: any) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) return false;

  const xSignature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(xSignature.split(",").map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }));

  const ts = parts.ts;
  const v1 = parts.v1;
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body?.data?.id ?? body?.id;
  if (!requestId || !ts || !v1 || !dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return expected.toLowerCase() === String(v1).toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const signatureValid = await validateSignature(req, url, body);
  if (!signatureValid) return json({ error: "invalid_signature" }, 401);

  const providerEventId = String(body?.id ?? body?.data?.id ?? "");
  const paymentId = String(body?.data?.id ?? body?.id ?? "");
  const eventType = String(body?.type ?? body?.action ?? "unknown");
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
    .select("id,processing_status,processed_at")
    .single();

  if (eventInsertError) {
    if (eventInsertError.code === "23505") {
      return json({ received: true, duplicate: true });
    }
    console.error("payment_event_insert_failed", eventInsertError);
    return json({ error: "temporary_processing_failure" }, 503);
  }

  if (!paymentId || (body?.type !== "payment" && body?.action !== "payment.updated")) {
    await db.from("payment_events").update({ processing_status: "ignored", processed_at: new Date().toISOString() }).eq("id", eventRow.id);
    return json({ received: true, ignored: true });
  }

  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!token) {
    await db.from("payment_events").update({ processing_status: "failed", processing_error: "missing_access_token" }).eq("id", eventRow.id);
    return json({ error: "temporary_processing_failure" }, 503);
  }

  try {
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!paymentResponse.ok) {
      const detail = await paymentResponse.text();
      await db.from("payment_events").update({ processing_status: "failed", processing_error: `payment_fetch_${paymentResponse.status}:${detail.slice(0, 500)}` }).eq("id", eventRow.id);
      return json({ error: "temporary_processing_failure" }, 503);
    }

    const payment = await paymentResponse.json();
    const orderId = payment.external_reference;
    if (!orderId) throw new Error("missing_external_reference");

    const amountCents = Math.round(Number(payment.transaction_amount ?? 0) * 100);
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

    return json({ received: true, result: result?.[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("payment_webhook_failed", error);
    await db.from("payment_events").update({
      processing_status: "failed",
      processing_error: message.slice(0, 1000),
    }).eq("id", eventRow.id);
    return json({ error: "temporary_processing_failure" }, 503);
  }
});