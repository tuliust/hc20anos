import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const BAND_COPY = "A definir, dependendo do número de participantes";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("HC-05 deixa o card de serviço sem fundo preto", async () => {
  const css = await source("src/eventStage4Enhancements.css");
  assert.match(css, /\[data-event-service-card="true"\]/);
  assert.match(css, /background:\s*#f3f5f2\s*!important/);
});

test("HC-06 remove DJ da programação e das atrações públicas", async () => {
  const enhancement = await source("src/eventStage4Enhancements.ts");
  const migration = await source("supabase/migrations/20260917103500_event_stage4_requested_adjustments.sql");

  assert.match(enhancement, /normalizedTitle === "dj"/);
  assert.doesNotMatch(migration, /"title"\s*:\s*"DJ"/i);
});

test("HC-07 usa a redação exata para Banda", async () => {
  const enhancement = await source("src/eventStage4Enhancements.ts");
  const migration = await source("supabase/migrations/20260917103500_event_stage4_requested_adjustments.sql");

  assert.ok(enhancement.includes(BAND_COPY));
  assert.ok(migration.includes(BAND_COPY));
});

test("HC-08 remove os cards públicos de Banheiros e Segurança", async () => {
  const enhancement = await source("src/eventStage4Enhancements.ts");
  const migration = await source("supabase/migrations/20260917103500_event_stage4_requested_adjustments.sql");

  assert.match(enhancement, /normalizedTitle === "banheiros" \|\| normalizedTitle === "seguranca"/);
  assert.match(migration, /structure_section_title = 'Bar e comidas'/);
  assert.match(migration, /bathrooms_text = ''/);
  assert.match(migration, /security_text = ''/);
});

test("a Etapa 4 é instalada no bootstrap público", async () => {
  const main = await source("src/main.tsx");
  assert.match(main, /installEventStage4Enhancements/);
  assert.match(main, /eventStage4Enhancements\.css/);
});
