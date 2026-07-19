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

async function hydratePayload(db: ReturnType<typeof getDb>, job: any) {
  const payload = { ...(job.payload_json ?? {}) };
  if (!job.ticket_id) return payload;

  const { data, error } = await db
    .from("tickets")
    .select("id, order_id, attendee_name, attendee_email, attendee_phone, qr_code, qr_token, status, orders!inner(buyer_email, buyer_phone, payment_status), ticket_types(name)")
    .eq("id", job.ticket_id)
    .maybeSingle();

  if (error) throw new Error(`ticket_hydration_failed:${error.message}`);
  if (!data) throw new Error("ticket_not_found");

  const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
  const ticketType = Array.isArray(data.ticket_types) ? data.ticket_types[0] : data.ticket_types;
  return {
    ...payload,
    participant_name: payload.participant_name ?? data.attendee_name,
    recipient_email: payload.recipient_email ?? data.attendee_email ?? order?.buyer_email,
    recipient_phone: payload.recipient_phone ?? data.attendee_phone ?? order?.buyer_phone,
    ticket_code: payload.ticket_code ?? data.qr_code,
    qr_token: payload.qr_token ?? data.qr_token,
    ticket_status: data.status,
    payment_status: order?.payment_status,
    ticket_type_name: ticketType?.name ?? "Ingresso",
  };
}

async function deliverEmail(job: any, payload: Record<string, unknown>) {
  const providerKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("TRANSACTIONAL_FROM_EMAIL");
  if (!providerKey || !sender) throw new Error("email_configuration_missing");

  const participantName = escapeHtml(payload.participant_name || "Participante");
  const ticketCode = escapeHtml(payload.ticket_code || "");
  const ticketType = escapeHtml(payload.ticket_type_name || "Ingresso");
  const recipient = String(payload.recipient_email || job.recipient_email || "");
  if (!recipient) throw new Error("recipient_email_missing");

  const isResend = String(job.event_type).includes("resend");
  const subject = isResend ? "Reenvio do seu ingresso - HC 20 Anos" : "Ingresso confirmado - HC 20 Anos";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1e8;font-family:Arial,sans-serif;color:#173c2f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#ffffff;border-radius:18px"><tr><td style="padding:32px"><p style="text-transform:uppercase;letter-spacing:.12em;color:#9a7b3f;font-weight:700">HC 20 Anos</p><h1 style="margin:0 0 18px">${isResend ? "Seu ingresso foi reenviado" : "Ingresso confirmado"}</h1><p>Olá, <strong>${participantName}</strong>.</p><p>Seu ${ticketType} está disponível na Área do Comprador.</p><p style="font-size:18px">Código: <strong>${ticketCode}</strong></p><p><a href="${SITE_URL}/meus-pedidos" style="display:inline-block;background:#173c2f;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:700">Ver ingresso e QR Code</a></p><hr style="border:none;border-top:1px solid #ece7dc;margin:28px 0"><p style="color:#66746e">Evento: 24 de outubro de 2026, às 14h.</p><p style="color:#66746e">Apresente o QR Code individual na entrada. QR Codes cancelados, reembolsados ou substituídos não são válidos.</p></td></tr></table></td></tr></table></body></html>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`email_provider_error_${response.status}:${detail.slice(0, 180)}`);
  }
}

async function deliverWhatsApp(payload: Record<string, unknown>) {
  const providerUrl = Deno.env.get("WHATSAPP_PROVIDER_URL");
  const providerToken = Deno.env.get("WHATSAPP_PROVIDER_TOKEN");
  const template = Deno.env.get("WHATSAPP_TICKET_TEMPLATE");
  if (!providerUrl || !providerToken || !template) throw new Error("whatsapp_configuration_missing");

  const phone = String(payload.recipient_phone || "").replace(/\D/g, "");
  if (!phone) throw new Error("recipient_phone_missing");

  const response = await fetch(providerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: phone,
      template,
      language: "pt_BR",
      variables: {
        participant_name: String(payload.participant_name || "Participante"),
        ticket_code: String(payload.ticket_code || ""),
        ticket_url: `${SITE_URL}/meus-pedidos`,
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

  if (eventType.endsWith("_whatsapp")) {
    await deliverWhatsApp(payload);
    return;
  }

  await deliverEmail(job, payload);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "method_not_allowed" }, 405);

  const expectedKey = Deno.env.get("NOTIFICATION_WORKER_KEY");
  if (!expectedKey || request.headers.get("x-worker-key") !== expectedKey) {
    return respond({ error: "unauthorized" }, 401);
  }

  const db = getDb();
  const { data: jobs, error: claimError } = await db.rpc("claim_notification_jobs", {
    p_limit: 20,
    p_worker_id: crypto.randomUUID(),
  });
  if (claimError) return respond({ error: claimError.message }, 500);

  const results = [];
  for (const job of jobs ?? []) {
    try {
      await deliver(db, job);
      await db.rpc("complete_notification_job", {
        p_job_id: job.id,
        p_success: true,
        p_error: null,
      });
      results.push({ id: job.id, event_type: job.event_type, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "notification_error";
      await db.rpc("complete_notification_job", {
        p_job_id: job.id,
        p_success: false,
        p_error: message,
      });
      results.push({ id: job.id, event_type: job.event_type, success: false, error: message });
    }
  }

  return respond({ claimed: jobs?.length ?? 0, results });
});
