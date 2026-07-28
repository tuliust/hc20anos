import { supabase } from "./supabase";
import type { RpcRow } from "./rpc.types";

export type CheckoutParticipantType = "alumni" | "spouse" | "child" | "external_guest";
export type CheckoutExtraType = "drinks" | "barbecue";
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
  sponsor_person_id?: string | null;
  sponsor_user_id?: string | null;
}

export interface CheckoutExtraInput {
  participant_key: string;
  extra_type: CheckoutExtraType;
  quantity: number;
}

export interface CheckoutCreateInput {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  product_code: "simple" | "family_full" | "external_guest";
  participants: CheckoutParticipantInput[];
  extras?: CheckoutExtraInput[];
}

export interface CheckoutCreateResult {
  checkout_url: string;
  public_token?: string | null;
  expires_at?: string | null;
  reused_preference?: boolean;
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
    no_active_lot: "Não há lote de ingressos disponível neste momento.",
    invalid_primary_product: "O ingresso selecionado não está disponível no lote vigente.",
    unsupported_primary_product: "A categoria selecionada não pode ser comprada neste checkout.",
    alumni_registration_required: "Os ingressos Individual e Família são exclusivos para ex-aluno pré-cadastrado e vinculado à conta.",
    exactly_one_alumni_required: "Os ingressos Individual e Família são exclusivos para ex-aluno pré-cadastrado e vinculado à conta.",
    simple_package_invalid_composition: "O ingresso Individual deve conter somente o ex-aluno pré-cadastrado.",
    family_full_invalid_composition: "O ingresso Família exige um ex-aluno pré-cadastrado, um cônjuge e pelo menos um filho.",
    external_guest_package_invalid_composition: "O ingresso Convidado deve conter somente um participante adulto.",
    child_birth_date_required: "Informe a data de nascimento de cada filho.",
    child_birth_date_invalid: "A data de nascimento informada é inválida ou não atende à regra etária do ingresso.",
    external_guest_data_required: "Informe nome, e-mail, WhatsApp e data de nascimento do convidado.",
    external_guest_birth_date_invalid: "A data de nascimento do convidado é inválida.",
    external_guest_must_be_adult: "O ingresso Convidado é exclusivo para participantes com 18 anos ou mais na data do evento.",
    extras_not_supported: "Itens adicionais não fazem parte do modelo atual de ingressos.",
    invalid_extra: "Itens adicionais não fazem parte do modelo atual de ingressos.",
    participant_limit_exceeded: "O pedido pode ter no máximo seis participantes.",
    mercado_pago_not_configured: "O pagamento pelo Mercado Pago ainda não está configurado.",
    mercado_pago_preference_failed: "O Mercado Pago não conseguiu preparar o pagamento.",
    checkout_service_unavailable: "O serviço de pagamento está temporariamente indisponível.",
    invalid_checkout_response: "Não foi possível obter o link de pagamento do Mercado Pago.",
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

  const response = await fetch("/api/checkout-create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({ ...input, idempotency_key: idempotencyKey }),
  });

  const rawData = await response.json().catch(() => ({}));
  const data = unwrapCheckoutPayload(rawData) as Partial<CheckoutCreateResult> & {
    error?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  if (!response.ok) {
    throw new Error(checkoutErrorMessage(data.error));
  }

  const checkoutUrl = data.checkout_url ?? data.init_point ?? data.sandbox_init_point;
  if (!checkoutUrl) {
    console.error("[Checkout] Resposta sem URL do Mercado Pago", {
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
