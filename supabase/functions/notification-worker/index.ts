import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br").replace(/\/$/, "");
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Headers": "content-type, x-worker-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getDb() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("server_configuration_missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatMoney(cents: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents ?? 0) / 100);
}

function baseEventType(eventType: string) {
  return eventType.replace(/_(email|whatsapp)$/, "");
}

function normalizeWhatsAppPhone(value: unknown) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^\d{12,15}$/.test(digits)) throw new Error("recipient_phone_invalid");
  return digits;
}

async function hydratePayload(db: ReturnType<typeof getDb>, job: any) {
  const payload = { ...(job.payload_json ?? {}) };
  if (!job.ticket_id) return payload;
  const { data, error } = await db.from("tickets")
    .select("id, order_id, attendee_name, attendee_email, attendee_phone, qr_code, qr_token, status, orders!inner(buyer_name, buyer_email, buyer_phone, payment_status, total_amount_cents), ticket_types(name)")
    .eq("id", job.ticket_id).maybeSingle();
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

function notificationCopy(rawEventType: string, payload: Record<string, unknown>) {
  const eventType = baseEventType(rawEventType);
  const paymentStatus = String(payload.payment_status || eventType.replace("payment_", ""));
  const person = escapeHtml(payload.participant_name || payload.guest_name || payload.buyer_name || "Participante");
  const orderId = escapeHtml(String(payload.order_id || "").slice(0, 8).toUpperCase());
  const amount = escapeHtml(formatMoney(payload.total_amount_cents));

  if (eventType.startsWith("payment_")) {
    const copies: Record<string, { subject: string; title: string; message: string }> = {
      pending: { subject: "Pedido recebido - HC 20 Anos", title: "Pedido recebido", message: `Seu pedido ${orderId ? `#${orderId}` : ""} foi criado e aguarda pagamento. Total: ${amount}.` },
      in_process: { subject: "Pagamento em análise - HC 20 Anos", title: "Pagamento em análise", message: "O Mercado Pago está analisando o pagamento." },
      approved: { subject: "Pagamento aprovado - HC 20 Anos", title: "Pagamento aprovado", message: "O pagamento foi confirmado. Seus ingressos já estão na Área do Comprador." },
      rejected: { subject: "Pagamento não aprovado - HC 20 Anos", title: "Pagamento não aprovado", message: "O pagamento foi recusado. Faça uma nova tentativa de compra." },
      expired: { subject: "Pagamento expirado - HC 20 Anos", title: "Pagamento expirado", message: "A reserva expirou. Para participar, inicie uma nova compra." },
      cancelled: { subject: "Pedido cancelado - HC 20 Anos", title: "Pedido cancelado", message: "O pedido foi cancelado." },
      refunded: { subject: "Pagamento reembolsado - HC 20 Anos", title: "Pagamento reembolsado", message: "O reembolso foi registrado e os ingressos foram invalidados." },
      charged_back: { subject: "Pagamento contestado - HC 20 Anos", title: "Pagamento contestado", message: "O pagamento foi contestado e os ingressos estão inválidos." },
    };
    const copy = copies[paymentStatus] ?? copies.pending;
    return { ...copy, person, actionLabel: "Acompanhar pedido", actionUrl: `${SITE_URL}/meus-pedidos`, ticketCode: "" };
  }

  if (eventType === "guest_approval_requested") {
    return { subject: "Nova solicitação de convidado - HC 20 Anos", title: "Solicitação de convidado", message: `${person} solicitou sua aprovação para participar como convidado.`, person: escapeHtml(payload.sponsor_name || "Ex-aluno"), actionLabel: "Analisar solicitação", actionUrl: `${SITE_URL}/convidado`, ticketCode: "" };
  }
  if (eventType === "guest_approval_approved") {
    return { subject: "Convite aprovado - HC 20 Anos", title: "Seu convite foi aprovado", message: "A aprovação foi concluída. Você já pode seguir para a compra do ingresso.", person, actionLabel: "Comprar ingresso", actionUrl: `${SITE_URL}/ingressos`, ticketCode: "" };
  }
  if (eventType === "guest_approval_rejected") {
    return { subject: "Solicitação de convidado atualizada - HC 20 Anos", title: "Solicitação não aprovada", message: escapeHtml(payload.decision_notes || "A solicitação não foi aprovada pelo ex-aluno responsável."), person, actionLabel: "Ver solicitações", actionUrl: `${SITE_URL}/convidado`, ticketCode: "" };
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
      from: sender, to: [recipient], subject: copy.subject,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1e8;font-family:Arial,sans-serif;color:#173c2f"><table role="presentation" width="100%"><tr><td style="padding:28px"><table role="presentation" width="100%" style="max-width:620px;margin:auto;background:#fff;border-radius:18px"><tr><td style="padding:32px"><p style="text-transform:uppercase;color:#9a7b3f;font-weight:700">HC 20 Anos</p><h1>${copy.title}</h1><p>Olá, <strong>${copy.person}</strong>.</p><p>${copy.message}</p>${copy.ticketCode ? `<p>Código: <strong>${copy.ticketCode}</strong></p>` : ""}<p><a href="${copy.actionUrl}" style="display:inline-block;background:#173c2f;color:#fff;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:700">${copy.actionLabel}</a></p></td></tr></table></td></tr></table></body></html>`,
    }),
  });
  const providerPayload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`email_provider_error_${response.status}:${JSON.stringify(providerPayload).slice(0, 300)}`);
  return { provider: "resend", messageId: String(providerPayload.id ?? ""), response: providerPayload };
}

function whatsappTemplate(eventType: string) {
  const base = baseEventType(eventType);
  const envName = base.startsWith("payment_") ? "WHATSAPP_TEMPLATE_PAYMENT"
    : base.startsWith("ticket_") ? "WHATSAPP_TEMPLATE_TICKET"
    : base.startsWith("ticket_transfer_") ? "WHATSAPP_TEMPLATE_TRANSFER"
    : base.includes("refund") ? "WHATSAPP_TEMPLATE_REFUND"
    : base === "guest_approval_requested" ? "WHATSAPP_TEMPLATE_GUEST_REQUEST"
    : base.startsWith("guest_approval_") ? "WHATSAPP_TEMPLATE_GUEST_DECISION"
    : "WHATSAPP_TEMPLATE_DEFAULT";
  const template = Deno.env.get(envName);
  if (!template) throw new Error(`whatsapp_template_missing:${envName}`);
  return template;
}

async function deliverWhatsApp(eventType: string, payload: Record<string, unknown>) {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION");
  const language = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "pt_BR";
  if (!accessToken || !phoneNumberId || !graphVersion) throw new Error("whatsapp_configuration_missing");
  const phone = normalizeWhatsAppPhone(payload.recipient_phone);
  const copy = notificationCopy(eventType, payload);
  const template = whatsappTemplate(eventType);
  const parameters = [
    String(payload.participant_name || payload.guest_name || payload.buyer_name || payload.sponsor_name || "Participante"),
    copy.title,
    copy.message,
    String(payload.ticket_code || payload.order_id || "—").slice(0, 80),
    copy.actionUrl,
  ].map(text => ({ type: "text", text }));
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "template", template: { name: template, language: { code: language }, components: [{ type: "body", parameters }] } }),
  });
  const providerPayload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`whatsapp_provider_error_${response.status}:${JSON.stringify(providerPayload).slice(0, 500)}`);
  return { provider: "meta_whatsapp_cloud", messageId: String(providerPayload.messages?.[0]?.id ?? ""), response: providerPayload };
}

async function deliver(db: ReturnType<typeof getDb>, job: any) {
  const payload = await hydratePayload(db, job);
  const eventType = String(job.event_type || "");
  const result = eventType.endsWith("_whatsapp") ? await deliverWhatsApp(eventType, payload) : await deliverEmail(job, payload);
  await db.from("notification_jobs").update({
    channel: eventType.endsWith("_whatsapp") ? "whatsapp" : "email",
    provider_message_id: result.messageId || null,
    provider_response_json: result.response,
  }).eq("id", job.id);
}

Deno.serve(async request => {
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
