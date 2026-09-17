import { readFile } from "node:fs/promises";
import process from "node:process";

const files = {
  api: new URL("../api/generate-profile-bio.ts", import.meta.url),
  edit: new URL("../src/editProfileRequestedChangesEnhancement.ts", import.meta.url),
  external: new URL("../src/externalUserProfileContextEnhancement.ts", import.meta.url),
  migration: new URL("../supabase/migrations/20260917023000_profile_defaults_and_external_hc_context.sql", import.meta.url),
};

const [api, edit, external, migration] = await Promise.all(
  Object.values(files).map(file => readFile(file, "utf8")),
);

const checks = [
  [api.includes("escreva sempre em primeira pessoa"), "mini bio exige primeira pessoa"],
  [api.includes("não use o nome da pessoa no texto"), "mini bio não usa nome da pessoa"],
  [!api.includes("use terceira pessoa"), "prompt não mantém instrução de terceira pessoa"],
  [edit.includes("AUTOSAVE_DELAY_MS"), "questionário possui autosave"],
  [edit.includes("saveButton.hidden = true"), "botão manual de salvar fica oculto"],
  [edit.includes("data-hc-mini-bio-generate"), "ação de IA é recriada junto da Mini Bio"],
  [external.includes("Você estudou no HC?"), "cadastro externo pergunta vínculo com HC"],
  [external.includes("Em que ano você se formou?"), "cadastro externo coleta ano"],
  [external.includes("Qual era a sua sala?"), "cadastro externo coleta sala"],
  [external.includes("Qual a sua relação com a turma do HC de 2006?"), "cadastro externo coleta relação com a turma"],
  [migration.includes("alter column show_social_links set default true"), "redes sociais iniciam ativas em novos perfis"],
  [migration.includes("studied_at_hc"), "banco persiste declaração de vínculo com HC"],
  [migration.includes("relationship_to_class"), "banco persiste relação com a turma"],
];

const failed = checks.filter(([passed]) => !passed);
for (const [passed, label] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
}

if (failed.length) {
  console.error(`\n${failed.length} verificação(ões) dos ajustes de perfil falharam.`);
  process.exit(1);
}

console.log("\nContrato dos primeiros ajustes de perfil validado.");
