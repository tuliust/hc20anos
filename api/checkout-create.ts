const FALLBACK_SUPABASE_URL = "https://tjnqqsbwgjcdzcxykyif.supabase.co";

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseJsonPayload(value: string): any {
  let parsed: any = value;

  for (let attempt = 0; attempt < 2 && typeof parsed === "string"; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return { message: parsed };
    }
  }

  return parsed && typeof parsed === "object" ? parsed : {};
}

function unwrapPayload(payload: any) {
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload?.result && typeof payload.result === "object") return payload.result;
  return payload ?? {};
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

    const rawBody = await upstream.text();
    const parsedBody = parseJsonPayload(rawBody);
    const payload = unwrapPayload(parsedBody);

    response.setHeader("Cache-Control", "no-store");

    if (!upstream.ok) {
      return response.status(upstream.status).json(
        payload && typeof payload === "object"
          ? payload
          : { error: "checkout_upstream_error" },
      );
    }

    const checkoutUrl = payload.checkout_url
      ?? payload.init_point
      ?? payload.sandbox_init_point
      ?? null;
    const publicToken = payload.public_token
      ?? payload.token
      ?? null;
    const expiresAt = payload.expires_at
      ?? payload.expiration_date_to
      ?? null;

    if (!checkoutUrl) {
      console.error("[api/checkout-create] Successful upstream response without checkout URL", {
        upstreamStatus: upstream.status,
        payloadKeys: Object.keys(payload ?? {}),
      });
      return response.status(502).json({ error: "invalid_checkout_response" });
    }

    return response.status(upstream.status).json({
      ...payload,
      checkout_url: checkoutUrl,
      public_token: publicToken,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("[api/checkout-create] Upstream request failed", error);
    return response.status(502).json({ error: "checkout_service_unavailable" });
  }
}
