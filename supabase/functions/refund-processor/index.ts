import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!url || !anon || !service || !mpToken) return json({ error: "server_configuration_missing" }, 500);

  const authorization = request.headers.get("authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "authentication_required" }, 401);

  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: admin } = await db.from("admin_users").select("id, role").eq("user_id", userData.user.id).in("role", ["superadmin", "admin"]).maybeSingle();
  if (!admin) return json({ error: "admin_required" }, 403);

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.request_id ?? "");
  if (!requestId) return json({ error: "request_id_required" }, 400);

  const { data: refundRequest, error: refundError } = await db.from("refund_requests").select("*, orders!inner(*)").eq("id", requestId).maybeSingle();
  if (refundError || !refundRequest) return json({ error: "refund_request_not_found" }, 404);
  if (refundRequest.status !== "approved") return json({ error: "refund_not_approved" }, 409);

  const order = Array.isArray(refundRequest.orders) ? refundRequest.orders[0] : refundRequest.orders;
  const paymentId = refundRequest.provider_payment_id ?? order.payment_provider_order_id;
  if (!paymentId) return json({ error: "payment_id_missing" }, 409);

  await db.from("refund_requests").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", requestId);

  const amount = Number(refundRequest.refund_amount_cents) / 100;
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `hc20-refund-${requestId}`,
    },
    body: JSON.stringify({ amount }),
  });
  const mpPayload = await mpResponse.json().catch(() => ({}));

  if (!mpResponse.ok) {
    await db.from("refund_requests").update({ status: "failed", failure_reason: `mercado_pago_${mpResponse.status}`, provider_response_json: mpPayload, updated_at: new Date().toISOString() }).eq("id", requestId);
    return json({ error: "mercado_pago_refund_failed", detail: mpPayload }, 502);
  }

  const now = new Date().toISOString();
  const { error: orderUpdateError } = await db.from("orders").update({ payment_status: "refunded", refunded_at: now, updated_at: now }).eq("id", order.id);
  if (orderUpdateError) return json({ error: orderUpdateError.message }, 500);

  await db.from("tickets").update({ status: "refunded", cancelled_at: now, cancellation_reason: "payment_refunded", updated_at: now }).eq("order_id", order.id).not("status", "in", "(transferred,refunded)");
  await db.from("order_participants").update({ status: "refunded", updated_at: now }).eq("order_id", order.id).not("status", "eq", "transferred");

  if (!refundRequest.inventory_restored_at) {
    await db.rpc("restore_refunded_order_inventory", { p_order_id: order.id });
  }

  await db.from("refund_requests").update({
    status: "refunded",
    mercado_pago_refund_id: String(mpPayload.id ?? ""),
    provider_response_json: mpPayload,
    processed_at: now,
    inventory_restored_at: now,
    updated_at: now,
  }).eq("id", requestId);

  await db.from("notification_jobs").upsert({
    event_type: "payment_refunded",
    order_id: order.id,
    recipient_email: order.buyer_email,
    idempotency_key: `refund-completed:${requestId}`,
    payload_json: { order_id: order.id, refund_amount_cents: refundRequest.refund_amount_cents },
  }, { onConflict: "idempotency_key", ignoreDuplicates: true });

  return json({ success: true, refund_id: mpPayload.id, amount });
});