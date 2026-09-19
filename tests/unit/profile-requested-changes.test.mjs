import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("HC-03 mini bio contract uses first person and bounded output", async () => {
  const api = await source("api/generate-profile-bio.ts");
  assert.match(api, /escreva sempre em primeira pessoa/);
  assert.match(api, /não use o nome da pessoa no texto/);
  assert.match(api, /produza de 2 a 4 frases, com no máximo 500 caracteres/);
  assert.match(api, /use somente os dados fornecidos e não invente fatos/);
  assert.match(api, /normalizeText\(parsed\?\.bio, 500\)/);
  assert.doesNotMatch(api, /use terceira pessoa/);
});

test("HC-01 questionnaire autosaves without a visible save action", async () => {
  const edit = await source("src/editProfileRequestedChangesEnhancement.ts");
  const questionnaire = await source("src/editProfileEnhancements.ts");
  assert.match(edit, /AUTOSAVE_DELAY_MS/);
  assert.match(edit, /saveButton\.hidden = true/);
  assert.match(edit, /Salvando\.\.\./);
  assert.match(edit, /Respostas salvas automaticamente\./);
  assert.match(questionnaire, /profile_school_questionnaire_answers/);
  assert.match(questionnaire, /saveSchoolQuestionnaireAnswers/);
});

test("HC-02 AI action is moved below Mini bio", async () => {
  const edit = await source("src/editProfileRequestedChangesEnhancement.ts");
  assert.match(edit, /findFieldContainer\(root, "Mini bio"\)/);
  assert.match(edit, /bioContainer\.insertAdjacentElement\("afterend", actions\)/);
  assert.match(edit, /data-hc-mini-bio-generate/);
  assert.match(edit, /Gerar Perfil com IA/);
});

test("HC-04 new profiles start with all six privacy controls enabled", async () => {
  const app = await source("src/app/App.tsx");
  const migration = await source("supabase/migrations/20260917052813_profile_defaults_and_external_hc_context.sql");
  assert.match(app, /showCurrentPhoto: true, showCity: true, showProfession: true, showSocial: true, showInList: true, allowTagging: true/);
  assert.match(migration, /alter column show_social_links set default true/);
});

test("HC-14 external registration collects and persists HC relationship", async () => {
  const external = await source("src/externalUserProfileContextEnhancement.ts");
  const migration = await source("supabase/migrations/20260917061255_finalize_external_hc_context_names.sql");
  assert.match(external, /Você estudou no HC\?/);
  assert.match(external, /Em que ano você se formou\?/);
  assert.match(external, /Qual era a sua sala\?/);
  assert.match(external, /Qual a sua relação com a turma do HC de 2006\?/);
  assert.match(external, /studied_at_hc/);
  assert.match(external, /class_year/);
  assert.match(external, /class_group/);
  assert.match(external, /relationship_to_class/);
  assert.match(migration, /rename column hc_graduation_year to class_year/);
  assert.match(migration, /rename column hc_class_group to class_group/);
});
