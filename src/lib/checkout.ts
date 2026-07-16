import { supabase } from "./supabase";

export type CheckoutParticipantType = "alumni" | "spouse" | "child" | "external_guest";
export type CheckoutExtraType = "drinks" | "barbecue";

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
  guest_approval_request_id?: string | null;
}

export interface CheckoutExtraInput {
  participant_client_key: string;
  extra_type: CheckoutExtraType;
  quantity: number;
}

export interface CheckoutCreateInput {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  product_code: "simple" | "family_full" | "family_single_parent";
  participants: CheckoutParticipantInput[];
  extras?: CheckoutExtraInput[];
}

export interface CheckoutCreateResult {
  checkout_url: string;
  public_token: string;
  expires_at: string;
  reused_preference?: boolean;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createSecureCheckout(
  input: CheckoutCreateInput,
  idempotencyKey = createIdempotencyKey(),
): Promise<CheckoutCreateResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("authentication_required");

  const { data, error } = await supabase.functions.invoke<CheckoutCreateResult>("checkout-create", {
    body: input,
    headers: { "idempotency-key": idempotencyKey },
  });

  if (error) throw error;
  if (!data?.checkout_url || !data.public_token || !data.expires_at) {
    throw new Error("invalid_checkout_response");
  }

  return data;
}

export async function getCheckoutStatus(publicToken: string) {
  const { data, error } = await (supabase as any).rpc("get_checkout_status_by_token", {
    p_public_token: publicToken,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : data;
}
