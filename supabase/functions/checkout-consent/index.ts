import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br").replace(/\/$/, "");
const TERMS_VERSION = "2026-07-21";
const PRIVACY_VERSION = "2026-07-21";

function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function brl(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function html(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmação de compra · HC 20 Anos</title><style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0d1a0f;color:#f0ebe0;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(680px,100%);background:#141f14;border:1px solid rgba(45,106,79,.5);padding:28px}.eyebrow{font:700 11px monospace;letter-spacing:.16em;text-transform:uppercase;color:#c9a84c}.title{font-family:Georgia,serif;font-size:32px;margin:8px 0 12px}.muted{color:#a7b7a8;line-height:1.6}.summary{margin:24px 0;padding:16px;border:1px solid rgba(45,106,79,.45);background:#0d1a0f}.row{display:flex;justify-content:space-between;gap:18px;margin:6px 0}.check{display:flex;gap:12px;align-items:flex-start;margin:22px 0;line-height:1.5}.check input{margin-top:4px;transform:scale(1.2)}a{color:#d8be72}.btn{width:100%;border:1px solid #c9a84c;background:#c9a84c;color:#0d1a0f;font-weight:800;padding:14px 18px;font-size:16px;cursor:pointer}.btn:hover{filter:brightness(1.05)}.error{border-color:#8f3b32;background:#2b1210}.small{font-size:12px;color:#7f9382;margin-top:16px;line-height:1.5}
  </style></head><body>${body}</body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function resolveOrder(token: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) return null;
  const client = db();
  const { data: order, error } = await client
    .from("orders")
    .select("id,buyer_user_id,buyer_name,total_amount_cents,expires_at,payment_status,reservation_status")
    .eq("public_token", token)
    .maybeSingle();
  if (error || !order) return null;
  const { data: pref, error: prefError } = await client
    .from("payment_preferences")
    .select("checkout_url,expires_at,status")
    .eq("order_id", order.id)
    .eq("status", "active")
    .maybeSingle();
  if (prefError || !pref) return null;
  return { client, order, pref };
}

function invalidPage(message: string, status = 400) {
  return html(`<main class="card error"><div class="eyebrow">HC 20 Anos</div><h1 class="title">Não foi possível continuar</h1><p class="muted">${escapeHtml(message)}</p><p><a href="${SITE_URL}/ingressos">Voltar para ingressos</a></p></main>`, status);
}

Deno.serve(async (request) => {
  if (request.method !== "GET" && request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let token = "";
  let accepted = false;
  if (request.method === "GET") {
    token = new URL(request.url).searchParams.get("token") ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("token") ?? "");
    accepted = String(form?.get("accepted") ?? "") === "yes";
  }

  const resolved = await resolveOrder(token);
  if (!resolved) return invalidPage("O link de pagamento é inválido ou não está mais disponível.", 404);
  const { client, order, pref } = resolved;

  const expiry = Date.parse(String(order.expires_at ?? pref.expires_at ?? ""));
  if (order.payment_status !== "pending" || order.reservation_status !== "active" || !Number.isFinite(expiry) || expiry <= Date.now()) {
    return invalidPage("Esta reserva expirou ou já foi processada. Gere uma nova tentativa de pagamento.", 409);
  }

  if (request.method === "POST") {
    if (!accepted) return invalidPage("É necessário aceitar os Termos de Uso e a Política de Privacidade para prosseguir.", 400);
    const { error: acceptanceError } = await client
      .from("checkout_terms_acceptances")
      .upsert({
        order_id: order.id,
        buyer_user_id: order.buyer_user_id,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        accepted_at: new Date().toISOString(),
        accepted_via: "checkout_consent",
      }, { onConflict: "order_id" });
    if (acceptanceError) {
      console.error("checkout_consent_acceptance_write_failed", acceptanceError);
      return invalidPage("Não foi possível registrar o aceite. Tente novamente.", 503);
    }
    return new Response(null, { status: 303, headers: { Location: pref.checkout_url, "Cache-Control": "no-store" } });
  }

  return html(`<main class="card"><div class="eyebrow">HC 20 Anos · Pagamento</div><h1 class="title">Confirme antes de ir ao Mercado Pago</h1><p class="muted">Revise o pedido e confirme o aceite das condições para continuar para o pagamento.</p><div class="summary"><div class="row"><span>Comprador</span><strong>${escapeHtml(order.buyer_name)}</strong></div><div class="row"><span>Total</span><strong>${escapeHtml(brl(Number(order.total_amount_cents)))}</strong></div></div><form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><label class="check"><input type="checkbox" name="accepted" value="yes" required><span>Li e aceito os <a href="${SITE_URL}/termos" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="${SITE_URL}/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label><button class="btn" type="submit">Continuar para o Mercado Pago</button></form><p class="small">O pagamento somente será considerado confirmado após validação do Mercado Pago e registro do status no sistema.</p></main>`);
});
