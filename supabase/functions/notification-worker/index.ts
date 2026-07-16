import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br";
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

async function deliver(job: any) {
  const providerKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("TRANSACTIONAL_FROM_EMAIL");
  if (!providerKey || !sender) throw new Error("email_configuration_missing");

  const payload = job.payload_json ?? {};
  const participantName = String(payload.participant_name ?? "Participante");
  const ticketCode = String(payload.ticket_code ?? payload.qr_code ?? "");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [job.recipient_email],
      subject: "Ingresso confirmado - HC 20 Anos",
      html: `<h1>Ingresso confirmado</h1><p>Olá, ${participantName}.</p><p>Código: <strong>${ticketCode}</strong></p><p>Consulte o QR Code e seus extras em <a href="${SITE_URL.replace(/\/$/, "")}/minha-area">Minha Área</a>.</p><p>Evento: 24 de outubro de 2026.</p>`,
    }),
  });

  if (!response.ok) throw new Error(`email_provider_error_${response.status}`);
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
      await deliver(job);
      await db.rpc("complete_notification_job", {
        p_job_id: job.id,
        p_success: true,
        p_error: null,
      });
      results.push({ id: job.id, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "notification_error";
      await db.rpc("complete_notification_job", {
        p_job_id: job.id,
        p_success: false,
        p_error: message,
      });
      results.push({ id: job.id, success: false });
    }
  }

  return respond({ claimed: jobs?.length ?? 0, results });
});
