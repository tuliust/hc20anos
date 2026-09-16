import { supabase } from "./supabase";
import type { RpcRow } from "./rpc.types";

export type CheckoutParticipantType = "alumni" | "spouse" | "child";
export type CheckoutStatusRow = RpcRow<"get_checkout_status_by_token">;

export interface CheckoutParticipantInput {
  client_key: string;
  participant_type: CheckoutParticipantType;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  relationship_to_alumni?: string | null;
  person_id?: string | null;
  user_id?: string | null;
}

export interface CheckoutCreateInput {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  product_code: "simple";
  participants: CheckoutParticipantInput[];
  extras?: never[];
}

export interface CheckoutCreateResult {
  checkout_url: string;
  public_token?: string | null;
  expires_at?: string | null;
  reused_preference?: boolean;
  consent_required?: boolean;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function unwrapCheckoutPayload(value: any): any {
  let payload = value;
  for (let attempt = 0; attempt < 2 && typeof payload === "string"; attempt += 1) {
    try {
      payload = JSON.parse(payload);
    } catch {
      return {};
    }
  }
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload?.result && typeof payload.result === "object") return payload.result;
  return payload && typeof payload === "object" ? payload : {};
}

function checkoutErrorMessage(code?: string) {
  const messages: Record<string, string> = {
    authentication_required: "Sua sessão expirou. Entre novamente para continuar.",
    buyer_user_mismatch: "Não foi possível validar sua identidade para esta compra.",
    no_active_lot: "As vendas não estão abertas neste momento.",
    invalid_primary_product: "O ingresso não está disponível no lote vigente.",
    unsupported_primary_product: "A categoria selecionada não pode ser comprada neste checkout.",
    alumni_registration_required: "Conclua seu cadastro de ex-aluno antes de comprar o ingresso.",
    exactly_one_alumni_required: "O pedido deve conter exatamente um ex-aluno vinculado à conta.",
    spouse_limit_exceeded: "É permitido incluir no máximo um cônjuge por pedido.",
    child_birth_date_required: "Informe a data de nascimento de cada filho.",
    child_birth_date_invalid: "Confira a data de nascimento informada para o filho.",
    extras_not_supported: "O churrasco já está incluído; bebidas devem ser levadas por cada participante.",
    participant_limit_exceeded: "O pedido pode ter no máximo seis participantes.",
    lot_capacity_exceeded: "Não há vagas suficientes para todos os participantes deste pedido.",
    checkout_idempotency_expired: "Esta tentativa de pagamento expirou. Inicie uma nova compra.",
    mercado_pago_not_configured: "O pagamento pelo Mercado Pago ainda não está configurado.",
    mercado_pago_preference_failed: "O Mercado Pago não conseguiu preparar o pagamento.",
    checkout_service_unavailable: "O serviço de pagamento está temporariamente indisponível.",
    invalid_checkout_response: "Não foi possível obter o link de pagamento.",
  };
  return messages[code ?? ""] ?? code ?? "Não foi possível iniciar o pagamento.";
}

export async function createSecureCheckout(
  input: CheckoutCreateInput,
  idempotencyKey = createIdempotencyKey(),
): Promise<CheckoutCreateResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) throw new Error(checkoutErrorMessage("authentication_required"));

  let response: Response;
  try {
    response = await fetch("/api/checkout-create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({ ...input, extras: [], idempotency_key: idempotencyKey }),
    });
  } catch {
    throw new Error("Não foi possível conectar ao serviço de pagamento. Verifique sua conexão e tente novamente.");
  }

  const rawData = await response.json().catch(() => ({}));
  const data = unwrapCheckoutPayload(rawData) as Partial<CheckoutCreateResult> & {
    error?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  if (!response.ok) throw new Error(checkoutErrorMessage(data.error));

  const checkoutUrl = data.checkout_url ?? data.init_point ?? data.sandbox_init_point;
  if (!checkoutUrl) {
    console.error("[Checkout] Resposta sem URL de pagamento", {
      status: response.status,
      payloadKeys: Object.keys(data),
    });
    throw new Error(checkoutErrorMessage("invalid_checkout_response"));
  }

  return {
    ...data,
    checkout_url: checkoutUrl,
    public_token: data.public_token ?? null,
    expires_at: data.expires_at ?? null,
  };
}

export async function getCheckoutStatus(publicToken: string): Promise<CheckoutStatusRow | null> {
  const { data, error } = await supabase.rpc("get_checkout_status_by_token", {
    p_public_token: publicToken,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
