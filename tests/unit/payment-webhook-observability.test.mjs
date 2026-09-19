import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../../supabase/functions/payment-webhook/index.ts", import.meta.url),
  "utf8",
);

test("payment-webhook persiste diagnóstico legível para erros estruturados", () => {
  assert.match(source, /function formatProcessingError\(error: unknown\)/);
  assert.match(source, /\["code", value\.code\]/);
  assert.match(source, /\["message", value\.message\]/);
  assert.match(source, /\["details", value\.details\]/);
  assert.match(source, /\["hint", value\.hint\]/);
  assert.match(source, /const message = formatProcessingError\(error\)/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message : String\(error\)/);
});


test("payment-webhook permite reconciliação autenticada sem enfraquecer o webhook assinado", () => {
  assert.match(source, /async function authenticatedUser\(request: Request\)/);
  assert.match(source, /reconcile_payment_id/);
  assert.match(source, /buyer_user_id/);
  assert.match(source, /admin_users/);
  assert.match(source, /\["admin", "superadmin"\]/);
  assert.match(source, /return json\(request, \{ error: "forbidden" \}, 403\)/);
  assert.match(source, /applyProviderPayment\(db, reconciliationPaymentId, payment\)/);
  assert.match(source, /const signature = await validateSignature\(request, url, body\)/);
  assert.match(source, /return json\(request, \{ error: "invalid_signature" \}, 401\)/);
});


test("payment-webhook resolve preference do Checkout Pro pelo merchant order quando o pagamento não a expõe", () => {
  assert.match(source, /async function resolveProviderPreferenceId\(paymentId: string, payment: any\)/);
  assert.match(source, /\/merchant_orders\/\$\{encodeURIComponent\(merchantOrderId\)\}/);
  assert.match(source, /\/merchant_orders\/search\?external_reference=/);
  assert.match(source, /merchantOrderContainsPayment\(merchantOrder, paymentId\)/);
  assert.match(source, /merchant_order_external_reference_mismatch/);
  assert.match(source, /merchant_order_payment_mismatch/);
  assert.match(source, /merchant_order_preference_required/);
  assert.match(source, /const preferenceId = await resolveProviderPreferenceId\(paymentId, payment\)/);
  assert.match(source, /p_preference_id: preferenceId/);
});
