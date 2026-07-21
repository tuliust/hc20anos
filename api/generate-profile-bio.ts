type ProfileBioQuestionAnswer = {
  id: string;
  question: string;
  options: string[];
};

type ProfileBioRequest = {
  name: string;
  nickname?: string;
  city?: string;
  profession?: string;
  answers: ProfileBioQuestionAnswer[];
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function sanitizeRequest(body: unknown): ProfileBioRequest | null {
  const parsed = parseBody(body) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== "object") return null;

  const name = normalizeText(parsed.name, 120);
  if (!name) return null;

  const rawAnswers = Array.isArray(parsed.answers) ? parsed.answers.slice(0, 5) : [];
  const answers = rawAnswers.map(item => {
    const answer = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const options = Array.isArray(answer.options)
      ? answer.options.slice(0, 12).map(option => normalizeText(option, 120)).filter(Boolean)
      : [];

    return {
      id: normalizeText(answer.id, 80),
      question: normalizeText(answer.question, 220),
      options,
    };
  }).filter(answer => answer.id && answer.question);

  return {
    name,
    nickname: normalizeText(parsed.nickname, 120) || undefined,
    city: normalizeText(parsed.city, 120) || undefined,
    profession: normalizeText(parsed.profession, 160) || undefined,
    answers,
  };
}

function getClientIp(request: any) {
  const forwarded = firstHeader(request.headers?.["x-forwarded-for"]);
  return forwarded?.split(",")[0]?.trim()
    || firstHeader(request.headers?.["x-real-ip"])
    || "unknown";
}

function isRateLimited(clientIp: string) {
  const scope = globalThis as any;
  const now = Date.now();
  const store: Map<string, number[]> = scope.__profileBioRateLimit ?? new Map();
  scope.__profileBioRateLimit = store;

  const recent = (store.get(clientIp) ?? []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    store.set(clientIp, recent);
    return true;
  }

  recent.push(now);
  store.set(clientIp, recent);
  return false;
}

function isSameOriginRequest(request: any) {
  const origin = firstHeader(request.headers?.origin);
  const host = firstHeader(request.headers?.host);
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text;

  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string") return part.text;
    }
  }

  return "";
}

function parseGeneratedBio(payload: any) {
  const rawText = extractResponseText(payload).trim();
  if (!rawText) return "";

  try {
    const parsed = JSON.parse(rawText);
    return normalizeText(parsed?.bio, 500);
  } catch {
    return normalizeText(rawText, 500);
  }
}

const PROFILE_BIO_INSTRUCTIONS = `Você escreve perfis curtos para o site privado de um reencontro escolar de 20 anos.

Regras obrigatórias:
- escreva em português do Brasil;
- use terceira pessoa e um tom nostálgico, natural e respeitoso;
- produza de 2 a 4 frases, com no máximo 500 caracteres;
- use somente os dados fornecidos e não invente fatos;
- não mencione que o texto foi gerado por IA;
- não inclua dados de contato, data de nascimento ou qualquer informação sensível;
- não use hashtags, emojis ou listas;
- evite clichês excessivos e preserve a individualidade das respostas;
- quando uma pergunta não tiver resposta, simplesmente ignore esse tema.`;

export default async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  if (!isSameOriginRequest(request)) {
    return response.status(403).json({ error: "forbidden_origin" });
  }

  if (isRateLimited(getClientIp(request))) {
    return response.status(429).json({ error: "rate_limit_exceeded" });
  }

  const input = sanitizeRequest(request.body);
  if (!input) {
    return response.status(400).json({ error: "invalid_request" });
  }

  const runtimeEnv = (globalThis as any).process?.env ?? {};
  const apiKey = String(runtimeEnv.OPENAI_API_KEY ?? "").trim();
  const model = String(runtimeEnv.OPENAI_PROFILE_MODEL ?? "gpt-5-mini").trim();

  if (!apiKey) {
    return response.status(503).json({ error: "openai_not_configured" });
  }

  const promptData = {
    name: input.name,
    nickname: input.nickname ?? null,
    city: input.city ?? null,
    profession: input.profession ?? null,
    questionnaire: input.answers.map(answer => ({
      question: answer.question,
      selected_options: answer.options,
    })),
  };

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "developer",
            content: [{ type: "input_text", text: PROFILE_BIO_INSTRUCTIONS }],
          },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: `Crie o perfil a partir destes dados:\n${JSON.stringify(promptData)}`,
            }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "school_reunion_profile_bio",
            strict: true,
            schema: {
              type: "object",
              properties: {
                bio: { type: "string" },
              },
              required: ["bio"],
              additionalProperties: false,
            },
          },
        },
        max_output_tokens: 600,
      }),
    });

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error("[api/generate-profile-bio] OpenAI request failed", {
        status: upstream.status,
        requestId: upstream.headers.get("x-request-id"),
      });
      return response.status(502).json({ error: "openai_request_failed" });
    }

    const bio = parseGeneratedBio(payload);
    if (!bio) {
      console.error("[api/generate-profile-bio] OpenAI response did not contain a valid bio", {
        requestId: upstream.headers.get("x-request-id"),
        status: payload?.status,
      });
      return response.status(502).json({ error: "invalid_openai_response" });
    }

    return response.status(200).json({ bio });
  } catch (error) {
    console.error("[api/generate-profile-bio] OpenAI service unavailable", error);
    return response.status(502).json({ error: "openai_service_unavailable" });
  }
}
