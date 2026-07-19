const FALLBACK_SUPABASE_URL = "https://tjnqqsbwgjcdzcxykyif.supabase.co";

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  const runtimeEnv = (globalThis as any).process?.env ?? {};
  const supabaseUrl = String(
    runtimeEnv.SUPABASE_URL
      ?? runtimeEnv.VITE_SUPABASE_URL
      ?? FALLBACK_SUPABASE_URL,
  ).replace(/\/$/, "");
  const authorization = firstHeader(request.headers.authorization);
  const apiKey = firstHeader(request.headers.apikey)
    ?? runtimeEnv.SUPABASE_ANON_KEY
    ?? runtimeEnv.VITE_SUPABASE_ANON_KEY;
  const idempotencyKey = firstHeader(request.headers["idempotency-key"]);

  if (!authorization) {
    return response.status(401).json({ error: "authentication_required" });
  }
  if (!apiKey) {
    return response.status(500).json({ error: "supabase_anon_key_missing" });
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/checkout-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        apikey: String(apiKey),
        ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
      },
      body: typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body ?? {}),
    });

    const body = await upstream.text();
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json; charset=utf-8");
    return response.status(upstream.status).send(body);
  } catch (error) {
    console.error("[api/checkout-create] Upstream request failed", error);
    return response.status(502).json({ error: "checkout_service_unavailable" });
  }
}
