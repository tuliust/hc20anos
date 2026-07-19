import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br").replace(/\/$/, "");
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Headers": "content-type, x-worker-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getDb() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("server_configuration_missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(cents: unknown) {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

async function hydratePayload(db: ReturnType<typeof getDb>, job: any) {
  const payload = { ...(job.payload_json ?? {}) };
  if (!job.ticket_id) return payload;

  const { data, error } = await db
    .from("tickets")
    .select("id, order_id, attendee_name, attendee_email, attendee_phone, qr_code, qr_token, status, orders!inner(buyer_name, buyer_email, buyer_phone, payment_status, total_amount_cents), ticket_types(name)")
    .eq("id", job.ticket_id)
    .maybeSingle();

  if (error) throw new Error(`ticket_hydration_failed:${error.message}`);
  if (!data) throw new Error("ticket_not_found");

  const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
  const ticketType = Array.isArray(data.ticket_types) ? data.ticket_types[0] : data.ticket_types;
  return {
    ...payload,
    buyer_name: payload.buyer_name ?? order?.buyer_name,
    participant_name: payload.participant_name ?? data.attendee_name,
    recipient_email: payload.recipient_email ?? data.attendee_email ?? order?.buyer_email,
    recipient_phone: payload.recipient_phone ?? data.attendee_phone ?? order?.buyer_phone,
    ticket_code: payload.ticket_code ?? data.qr_code,
    qr_token: payload.qr_token ?? data.qr_token,
    ticket_status: data.status,
    payment_status: order?.payment_status,
    total_amount_cents: payload.total_amount_cents ?? order?.total_amount_cents,
    ticket_type_name: ticketType?.name ?? "Ingresso",
  };
}

function notificationCopy(eventType: string, payload: Record<string, unknown>) {
  const paymentStatus = String(payload.payment_status || "");
  const person = escapeHtml(payload.participant_name || payload.buyer_name || "Participante");
  const orderId = escapeHtml(String(payload.order_id || "").slice(0, 8).toUpperCase());
  const amount = escapeHtml(formatMoney(payload.total_amount_cents));

  if (eventType.startsWith("payment_")) {
    const copies: Record<string, { subject: string; title: string; message: string }> = {
      pending: { subject: "Pedido recebido - HC 20 Anos", title: "Pedido recebido", message: `Seu pedido ${orderId ? `#${orderId}` : ""} foi criado e aguarda pagamento. Total: ${amount}.` },
      in_process: { subject: "Pagamento em análise - HC 20 Anos", title: "Pagamento em análise", message: "O Mercado Pago está analisando o pagamento. Avisaremos quando houver uma atualização." },
      approved: { subject: "Pagamento aprovado - HC 20 Anos", title: "Pagamento aprovado", message: "O pagamento foi confirmado. Seus ingressos individuais já podem ser consultados na Área do Comprador." },
      rejected: { subject: "Pagamento não aprovado - HC 20 Anos", title: "Pagamento não aprovado", message: "O pagamento foi recusado. Consulte o Mercado Pago ou faça uma nova tentativa de compra." },
      expired: { subject: "Pagamento expirado - HC 20 Anos", title: "Pagamento expirado", message: "A reserva e a preferência de pagamento expiraram. Para participar, será necessário iniciar uma nova compra." },
      cancelled: { subject: "Pedido cancelado - HC 20 Anos", title: "Pedido cancelado", message: "O pedido foi cancelado e os ingressos vinculados não são válidos." },
      refunded: { subject: "Pagamento reembolsado - HC 20 Anos", title: "Pagamento reembolsado", message: "O reembolso foi registrado. Os QR Codes vinculados ao pedido foram invalidados." },
      charged_back: { subject: "Pagamento contestado - HC 20 Anos", title: "Pagamento contestado", message: "O pagamento foi contestado. Os ingressos permanecerão inválidos enquanto a ocorrência estiver aberta." },
    };
    const copy = copies[paymentStatus] ?? copies.pending;
    return { ...copy, person, actionLabel: "Acompanhar pedido", actionUrl: `${SITE_URL}/meus-pedidos`, ticketCode: "" };
  }

  const isResend = eventType.includes("resend");
  return {
    subject: isResend ? "Reenvio do seu ingresso - HC 20 Anos" : "Ingresso confirmado - HC 20 Anos",
    title: isResend ? "Seu ingresso foi reenviado" : "Ingresso confirmado",
    message: `Seu ${escapeHtml(payload.ticket_type_name || "ingresso")} está disponível. Apresente o QR Code individual na entrada.`,
    person,
    actionLabel: "Ver ingresso e QR Code",
    actionUrl: `${SITE_URL}/meus-pedidos`,
    ticketCode: escapeHtml(payload.ticket_code || ""),
  };
}

async function deliverEmail(job: any, payload: Record<string, unknown>) {
  const providerKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("TRANSACTIONAL_FROM_EMAIL");
  if (!providerKey || !sender) throw new Error("email_configuration_missing");

  const recipient = String(payload.recipient_email || job.recipient_email || "");
  if (!recipient) throw new Error("recipient_email_missing");
  const copy = notificationCopy(String(job.event_type || ""), payload);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${providerKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: copy.subject,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1e8;font-family:Arial,sans-serif;color:#173c2f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#ffffff;border-radius:18px"><tr><td style="padding:32px"><p style="text-transform:uppercase;letter-spacing:.12em;color:#9a7b3f;font-weight:700">HC 20 Anos</p><h1 style="margin:0 0 18px">${copy.title}</h1><p>Olá, <strong>${copy.person}</strong>.</p><p>${copy.message}</p>${copy.ticketCode ? `<p style="font-size:18px">Código: <strong>${copy.ticketCode}</strong></p>` : ""}<p><a href="${copy.actionUrl}" style="display:inline-block;background:#173c2f;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:700">${copy.actionLabel}</a></p><hr style="border:none;border-top:1px solid #ece7dc;margin:28px 0"><p style="color:#66746e">Evento: 24 de outubro de 2026, às 14h.</p><p style="color:#66746e">QR Codes cancelados, reembolsados, transferidos ou substituídos não são válidos.</p></td></tr></table></td></tr></table></body></html>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`email_provider_error_${response.status}:${detail.slice(0, 180)}`);
  }
}

async function deliverWhatsApp(eventType: string, payload: Record<string, unknown>) {
  const providerUrl = Deno.env.get("WHATSAPP_PROVIDER_URL");
  const providerToken = Deno.env.get("WHATSAPP_PROVIDER_TOKEN");
  const ticketTemplate = Deno.env.get("WHATSAPP_TICKET_TEMPLATE");
  const paymentTemplate = Deno.env.get("WHATSAPP_PAYMENT_TEMPLATE") ?? ticketTemplate;
  const template = eventType.startsWith("payment_") ? paymentTemplate : ticketTemplate;
  if (!providerUrl || !providerToken || !template) throw new Error("whatsapp_configuration_missing");

  const phone = String(payload.recipient_phone || "").replace(/\D/g, "");
  if (!phone) throw new Error("recipient_phone_missing");
  const copy = notificationCopy(eventType, payload);

  const response = await fetch(providerUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${providerToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: phone,
      template,
      language: "pt_BR",
      variables: {
        name: String(payload.participant_name || payload.buyer_name || "Participante"),
        title: copy.title,
        message: copy.message,
        ticket_code: String(payload.ticket_code || ""),
        order_id: String(payload.order_id || "").slice(0, 8).toUpperCase(),
        payment_status: String(payload.payment_status || ""),
        ticket_url: copy.actionUrl,
        event_date: "24/10/2026",
        event_time: "14h",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`whatsapp_provider_error_${response.status}:${detail.slice(0, 180)}`);
  }
}

async function deliver(db: ReturnType<typeof getDb>, job: any) {
  const payload = await hydratePayload(db, job);
  const eventType = String(job.event_type || "");
  if (eventType.endsWith("_whatsapp")) await deliverWhatsApp(eventType, payload);
  else await deliverEmail(job, payload);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "method_not_allowed" }, 405);

  const expectedKey = Deno.env.get("NOTIFICATION_WORKER_KEY");
  if (!expectedKey || request.headers.get("x-worker-key") !== expectedKey) return respond({ error: "unauthorized" }, 401);

  const db = getDb();
  const { data: jobs, error: claimError } = await db.rpc("claim_notification_jobs", { p_limit: 20, p_worker_id: crypto.randomUUID() });
  if (claimError) return respond({ error: claimError.message }, 500);

  const results = [];
  for (const job of jobs ?? []) {
    try {
      await deliver(db, job);
      await db.rpc("complete_notification_job", { p_job_id: job.id, p_success: true, p_error: null });
      results.push({ id: job.id, event_type: job.event_type, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "notification_error";
      await db.rpc("complete_notification_job", { p_job_id: job.id, p_success: false, p_error: message });
      results.push({ id: job.id, event_type: job.event_type, success: false, error: message });
    }
  }

  return respond({ claimed: jobs?.length ?? 0, results });
});
