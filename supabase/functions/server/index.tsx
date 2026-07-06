import { Hono }  from "npm:hono";
import { cors }   from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── SETUP ────────────────────────────────────────────────────────────────────

const app = new Hono();
app.use("*", logger(console.log));
app.use("/*", cors({
  origin: Deno.env.get("SITE_URL") ?? "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "x-signature", "x-request-id"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Service-role client (server-side only — NUNCA exposto ao browser)
function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const BASE = "/make-server-62fab262";

function publicFunctionUrl(path: string) {
  const explicit = Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? Deno.env.get("FUNCTIONS_PUBLIC_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const base = explicit ?? (supabaseUrl ? `${supabaseUrl}/functions/v1` : "");
  return `${base.replace(/\/$/, "")}${BASE}${path}`;
}

function checkoutReturnUrl(status: string, orderId: string) {
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
  return `${siteUrl.replace(/\/$/, "")}/?checkout=${status}&order=${orderId}`;
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

async function validateMercadoPagoSignature(c: any, body: any) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[MP Webhook] MERCADO_PAGO_WEBHOOK_SECRET nao configurado");
    return false;
  }

  const xSignature = c.req.header("x-signature") ?? "";
  const requestId = c.req.header("x-request-id") ?? "";
  const parts = Object.fromEntries(xSignature.split(",").map((part: string) => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }));
  const ts = parts.ts;
  const v1 = parts.v1;
  const dataId = c.req.query("data.id") ?? c.req.query("id") ?? body.data?.id ?? body.id;

  if (!requestId || !ts || !v1 || !dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return expected.toLowerCase() === String(v1).toLowerCase();
}

async function sendTransactionalEmail(ticket: any, order: any) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("TRANSACTIONAL_FROM_EMAIL");
  if (!apiKey || !from) {
    console.log("[Email] Provedor nao configurado; email preparado", { order_id: order.id, ticket_id: ticket.id });
    return;
  }

  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  const html = `
    <h1>Ingresso confirmado</h1>
    <p>Ola, ${ticket.attendee_name}. Seu pagamento foi aprovado.</p>
    <p><strong>QR Code:</strong> ${ticket.qr_code}</p>
    <p>Apresente este codigo no check-in do reencontro.</p>
    ${siteUrl ? `<p><a href="${siteUrl.replace(/\/$/, "")}/">Acessar o site</a></p>` : ""}
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [ticket.attendee_email],
      subject: "Ingresso confirmado - Turma 2006 HC",
      html,
    }),
  });

  if (!res.ok) console.error("[Email] Falha ao enviar", await res.text());
}

async function sendWhatsAppTemplate(order: any, tickets: any[]) {
  const endpoint = Deno.env.get("WHATSAPP_PROVIDER_URL");
  const token = Deno.env.get("WHATSAPP_PROVIDER_TOKEN");
  const template = Deno.env.get("WHATSAPP_TICKET_TEMPLATE");
  if (!endpoint || !token || !template) {
    console.log("[WhatsApp] Provedor nao configurado; disparo ignorado", { order_id: order.id, tickets: tickets.length });
    return;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      template,
      to: order.buyer_phone,
      variables: {
        buyer_name: order.buyer_name,
        order_id: order.id,
        ticket_count: tickets.length,
      },
    }),
  });

  if (!res.ok) console.error("[WhatsApp] Falha ao enviar template", await res.text());
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get(`${BASE}/health`, (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ─── MERCADO PAGO — Criar Preferência ─────────────────────────────────────────
//
// POST /make-server-62fab262/mp/preference
// Body: { orderId: string }
//
// Cria uma preferência de pagamento no Mercado Pago e retorna o init_point.
// Deve ser chamado pelo client APÓS criar o order no Supabase.

app.post(`${BASE}/mp/preference`, async (c) => {
  const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

  if (!MP_TOKEN) {
    // MODO DEV: sem token real, retorna URL local de retorno
    const { orderId } = await c.req.json();
    console.warn("[MP] MERCADO_PAGO_ACCESS_TOKEN não configurado — modo dev");
    return c.json({
      dev_mode: true,
      init_point: checkoutReturnUrl("pending", orderId),
      sandbox_init_point: checkoutReturnUrl("pending", orderId),
      preference_id: `DEV-${orderId}`,
    });
  }

  try {
    const { orderId } = await c.req.json();
    const db = adminClient();

    // Carrega o pedido
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("*, ticket_types(name, price_cents)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return c.json({ error: "Pedido não encontrado" }, 404);
    }

    const ticketType = (order as any).ticket_types;
    const unitPrice  = (ticketType?.price_cents ?? order.total_amount_cents) / 100;

    // Cria preferência no Mercado Pago
    const mpBody = {
      items: [{
        id:           order.ticket_type_id,
        title:        ticketType?.name ?? "Ingresso — Turma 2006",
        quantity:     order.quantity,
        unit_price:   unitPrice,
        currency_id:  "BRL",
      }],
      payer: {
        name:  order.buyer_name,
        email: order.buyer_email,
        phone: { number: order.buyer_phone ?? "" },
      },
      external_reference: order.id,
      back_urls: {
        success: checkoutReturnUrl("approved", order.id),
        failure: checkoutReturnUrl("rejected", order.id),
        pending: checkoutReturnUrl("pending", order.id),
      },
      auto_return:         "approved",
      notification_url:   publicFunctionUrl("/mp/webhook"),
      statement_descriptor: "TURMA2006HC",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify(mpBody),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error("[MP] Erro ao criar preferência:", err);
      return c.json({ error: "Erro no Mercado Pago", detail: err }, 500);
    }

    const mpData = await mpRes.json();

    // Salva o preference_id no order
    await db.from("orders").update({
      payment_provider_preference_id: mpData.id,
    }).eq("id", order.id);

    return c.json({
      preference_id:       mpData.id,
      init_point:          mpData.init_point,
      sandbox_init_point:  mpData.sandbox_init_point,
    });

  } catch (err) {
    console.error("[MP] Exceção:", err);
    return c.json({ error: "Erro interno" }, 500);
  }
});

// ─── MERCADO PAGO — Webhook ───────────────────────────────────────────────────
//
// POST /make-server-62fab262/mp/webhook
// Recebe notificações do Mercado Pago, atualiza orders e emite tickets.

app.post(`${BASE}/mp/webhook`, async (c) => {
  const db = adminClient();

  const body = await c.req.json().catch(() => ({}));
  console.log("[MP Webhook] body:", JSON.stringify(body));

  const validSignature = await validateMercadoPagoSignature(c, body);
  if (!validSignature) {
    console.warn("[MP Webhook] assinatura invalida");
    return c.json({ error: "invalid_signature" }, 401);
  }

  // Registra o evento bruto
  await db.from("payment_events").insert({
    provider:      "mercadopago",
    event_type:    body.type ?? body.action ?? "unknown",
    provider_event_id: String(body.id ?? body.data?.id ?? ""),
    payload_json:  body,
  });

  // Processa apenas payment events
  if (body.type !== "payment" && body.action !== "payment.updated") {
    return c.json({ received: true });
  }

  const paymentId = body.data?.id ?? body.id;
  if (!paymentId) return c.json({ received: true });

  try {
    const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      console.warn("[MP Webhook] Sem token — ignorando");
      return c.json({ received: true });
    }

    // Busca dados completos do pagamento na API do MP
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${MP_TOKEN}` },
    });
    if (!payRes.ok) return c.json({ received: true });
    const payment = await payRes.json();

    const orderId      = payment.external_reference;
    const mpStatus     = payment.status;          // approved | rejected | pending | in_process
    const mpOrderId    = String(paymentId);
    const paymentMethod = payment.payment_method_id ?? null;

    // Mapeia status MP → status interno
    const statusMap: Record<string, string> = {
      approved:   "approved",
      rejected:   "rejected",
      pending:    "pending",
      in_process: "in_process",
      cancelled:  "cancelled",
      refunded:   "refunded",
      charged_back: "charged_back",
    };
    const internalStatus = statusMap[mpStatus] ?? "pending";

    // Atualiza o order
    const paidAt = mpStatus === "approved" ? new Date().toISOString() : null;
    const { data: order, error: orderErr } = await db.from("orders")
      .update({
        payment_status:           internalStatus as any,
        payment_provider_order_id: mpOrderId,
        payment_method:           paymentMethod,
        paid_at:                  paidAt,
      })
      .eq("id", orderId)
      .select("*, ticket_types(name)")
      .single();

    if (orderErr || !order) {
      console.error("[MP Webhook] Order não encontrado:", orderId, orderErr);
      return c.json({ received: true });
    }

    // Marca o evento no registro de payment_events
    await db.from("payment_events")
      .update({ order_id: orderId, processed_at: new Date().toISOString() })
      .eq("provider_event_id", mpOrderId)
      .is("order_id", null);

    // Se aprovado, cria o(s) ticket(s) se ainda não existirem
    if (mpStatus === "approved") {
      const { count } = await db.from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId);

      if ((count ?? 0) === 0) {
        const quantity = (order as any).quantity ?? 1;
        const ticketRows = Array.from({ length: quantity }, (_, index) => ({
          order_id:       orderId,
          ticket_type_id: (order as any).ticket_type_id,
          person_id:      (order as any).person_id ?? null,
          attendee_name:  index === 0 ? (order as any).buyer_name : `${(order as any).buyer_name} - acompanhante ${index}`,
          attendee_email: (order as any).buyer_email,
          attendee_phone: (order as any).buyer_phone ?? null,
        }));
        const { data: tickets, error: ticketErr } = await db.from("tickets").insert(ticketRows).select("*");
        if (ticketErr) throw ticketErr;

        // Incrementa sold_quantity
        await db.rpc("fn_increment_sold", {
          p_ticket_type_id: (order as any).ticket_type_id,
          delta: quantity,
        });

        for (const ticket of tickets ?? []) await sendTransactionalEmail(ticket, order);
        await sendWhatsAppTemplate(order, tickets ?? []);
      }
    }

    // Audit log
    await db.from("audit_logs").insert({
      action:        `payment_${internalStatus}`,
      entity_type:   "orders",
      entity_id:     orderId,
      metadata_json: { mp_payment_id: mpOrderId, mp_status: mpStatus },
    });

    return c.json({ received: true, status: internalStatus });

  } catch (err) {
    console.error("[MP Webhook] Erro:", err);
    return c.json({ received: true, error: "internal" }, 200); // sempre 200 para o MP não reenviar
  }
});

// ─── CRIAR ORDER (server-side, contorna RLS) ──────────────────────────────────
//
// POST /make-server-62fab262/orders
// Cria o order pelo service role para evitar que RLS bloqueie a inserção antes
// do usuário estar autenticado.

app.post(`${BASE}/orders`, async (c) => {
  try {
    const body = await c.req.json();
    const db   = adminClient();

    // Valida que o ticket_type existe e tem disponibilidade
    const { data: tt, error: ttErr } = await db
      .from("ticket_types")
      .select("*")
      .eq("id", body.ticket_type_id)
      .single();

    if (ttErr || !tt) return c.json({ error: "Tipo de ingresso não encontrado" }, 404);
    if (tt.status === "sold_out" || tt.status === "closed") {
      return c.json({ error: "Ingresso esgotado ou fora de venda" }, 400);
    }
    if ((tt.available_quantity - tt.sold_quantity) < (body.quantity ?? 1)) {
      return c.json({ error: "Quantidade indisponível" }, 400);
    }

    const { data: order, error: orderErr } = await db.from("orders").insert({
      event_id:           tt.event_id,
      buyer_name:         body.buyer_name,
      buyer_email:        body.buyer_email,
      buyer_phone:        body.buyer_phone ?? null,
      person_id:          body.person_id ?? null,
      ticket_type_id:     tt.id,
      quantity:           body.quantity ?? 1,
      total_amount_cents: tt.price_cents * (body.quantity ?? 1),
      payment_provider:   "mercadopago",
      payment_status:     "pending",
    }).select().single();

    if (orderErr) return c.json({ error: orderErr.message }, 500);
    return c.json({ order });

  } catch (err) {
    return c.json({ error: "Erro interno" }, 500);
  }
});

app.get(`${BASE}/orders/:id`, async (c) => {
  const orderId = c.req.param("id");
  const db = adminClient();

  const { data: order, error } = await db
    .from("orders")
    .select("id, ticket_type_id, quantity, total_amount_cents, payment_status, payment_method, paid_at, expires_at, payment_provider_preference_id, payment_provider_order_id, ticket_types(name), tickets(id, qr_code)")
    .eq("id", orderId)
    .single();

  if (error || !order) return c.json({ error: "Pedido nao encontrado" }, 404);
  return c.json({ order });
});

// ─── VERIFICAR CHECK-IN ───────────────────────────────────────────────────────
//
// GET /make-server-62fab262/checkin?q=HC2006-XXXX&mode=qr
// Busca ingresso para check-in (service role, sem RLS).

app.get(`${BASE}/checkin`, async (c) => {
  const q    = c.req.query("q") ?? "";
  const mode = c.req.query("mode") ?? "qr";
  const db   = adminClient();

  if (!q) return c.json({ error: "Query obrigatória" }, 400);

  try {
    let query = db.from("tickets")
      .select("*, orders(payment_status, buyer_name, buyer_email), ticket_types(name)")
      .limit(5);

    if (mode === "qr")    query = query.eq("qr_code", q.toUpperCase());
    else if (mode === "email") query = query.ilike("attendee_email", `%${q}%`);
    else if (mode === "phone") query = query.ilike("attendee_phone", `%${q}%`);
    else                  query = query.ilike("attendee_name", `%${q}%`);

    const { data, error } = await query;
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ tickets: data ?? [] });

  } catch (err) {
    return c.json({ error: "Erro interno" }, 500);
  }
});

// ─── REGISTRAR CHECK-IN ───────────────────────────────────────────────────────
//
// POST /make-server-62fab262/checkin
// Body: { ticketId: string, adminUserId: string }

app.post(`${BASE}/checkin`, async (c) => {
  const { ticketId, adminUserId } = await c.req.json();
  const db = adminClient();

  const { data: ticket, error: fetchErr } = await db
    .from("tickets").select("*").eq("id", ticketId).single();

  if (fetchErr || !ticket) return c.json({ error: "Ingresso não encontrado" }, 404);
  if ((ticket as any).checked_in) return c.json({ error: "already_used", ticket }, 409);

  const now = new Date().toISOString();
  const { error: updateErr } = await db.from("tickets").update({
    checked_in:              true,
    checked_in_at:           now,
    checked_in_by_admin_id:  adminUserId ?? null,
  }).eq("id", ticketId);

  if (updateErr) return c.json({ error: updateErr.message }, 500);

  await db.from("audit_logs").insert({
    user_id:       adminUserId ?? null,
    action:        "checkin",
    entity_type:   "tickets",
    entity_id:     ticketId,
    metadata_json: { checked_in_at: now },
  });

  return c.json({ success: true, checked_in_at: now });
});

// ─── START ────────────────────────────────────────────────────────────────────

Deno.serve(app.fetch);
