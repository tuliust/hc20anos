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
