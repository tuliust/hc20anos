import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeModuleId,
  replaceRangeRequired,
  replaceRequired,
} from "../../build/transformUtils.mjs";

test("normalizeModuleId normaliza Windows e remove query string", () => {
  assert.equal(
    normalizeModuleId("C:\\repo\\src\\app\\App.tsx?direct"),
    "C:/repo/src/app/App.tsx",
  );
});

test("replaceRequired substitui uma ocorrência única", () => {
  assert.equal(
    replaceRequired("antes alvo depois", "alvo", "novo", "trecho", "test"),
    "antes novo depois",
  );
});

test("replaceRequired rejeita trecho ausente ou duplicado", () => {
  assert.throws(
    () => replaceRequired("sem alvo", "x", "novo", "trecho", "test"),
    /Trecho não encontrado/,
  );
  assert.throws(
    () => replaceRequired("x e x", "x", "novo", "trecho", "test"),
    /Trecho duplicado/,
  );
});

test("replaceRangeRequired troca intervalo delimitado", () => {
  assert.equal(
    replaceRangeRequired(
      "prefix START conteúdo END suffix",
      "START",
      "END",
      "NOVO ",
      "faixa",
      "test",
    ),
    "prefix NOVO END suffix",
  );
});

test("replaceRangeRequired rejeita delimitadores ambíguos ou incompletos", () => {
  assert.throws(
    () => replaceRangeRequired("START a START b END", "START", "END", "", "faixa", "test"),
    /Início duplicado/,
  );
  assert.throws(
    () => replaceRangeRequired("START sem fim", "START", "END", "", "faixa", "test"),
    /Fim não encontrado/,
  );
});
