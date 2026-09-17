import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const enhancement = readFileSync(new URL("../../src/passwordVisibilityEnhancement.ts", import.meta.url), "utf8");
const main = readFileSync(new URL("../../src/main.tsx", import.meta.url), "utf8");

test("todos os campos de senha recebem controle de mostrar/ocultar", () => {
  assert.match(enhancement, /input\[type=\\?"password\\?"\]/);
  assert.match(enhancement, /input\.type = shouldShow \? "text" : "password"/);
  assert.match(enhancement, /aria-label.*Mostrar senha/);
  assert.match(enhancement, /Ocultar senha/);
  assert.match(enhancement, /MutationObserver/);
});

test("enhancement global de senha é instalado na aplicação", () => {
  assert.match(main, /installPasswordVisibilityEnhancement/);
  assert.match(main, /installPasswordVisibilityEnhancement\(\)/);
});
