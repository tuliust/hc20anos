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
