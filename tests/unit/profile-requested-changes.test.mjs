import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("mini bio contract uses first person", async () => {
  const api = await source("api/generate-profile-bio.ts");
  assert.match(api, /escreva sempre em primeira pessoa/);
  assert.match(api, /não use o nome da pessoa no texto/);
  assert.doesNotMatch(api, /use terceira pessoa/);
});

test("edit profile uses autosave and moves AI action", async () => {
  const edit = await source("src/editProfileRequestedChangesEnhancement.ts");
  assert.match(edit, /AUTOSAVE_DELAY_MS/);
  assert.match(edit, /saveButton\.hidden = true/);
  assert.match(edit, /data-hc-mini-bio-generate/);
});

test("external registration collects HC relationship", async () => {
  const external = await source("src/externalUserProfileContextEnhancement.ts");
  assert.match(external, /Você estudou no HC\?/);
  assert.match(external, /Em que ano você se formou\?/);
  assert.match(external, /Qual era a sua sala\?/);
  assert.match(external, /Qual a sua relação com a turma do HC de 2006\?/);
});
