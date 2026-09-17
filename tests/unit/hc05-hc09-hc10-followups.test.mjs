import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const enhancement = readFileSync(new URL("../../src/requestedFollowupsHC050910.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../src/requestedFollowupsHC050910.css", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../supabase/migrations/20260917150000_external_checkout_companions_hc09.sql", import.meta.url), "utf8");

test("HC-05 marca especificamente Data, Horário e Local e remove fundo sólido", () => {
  assert.match(enhancement, /new Set\(\["data", "horario", "local"\]\)/);
  assert.match(enhancement, /dataset\.hcEventInfoCard = "true"/);
  assert.match(styles, /\[data-hc-event-info-card="true"\][\s\S]*background: transparent !important/);
});

test("HC-09 reabre composição para usuário externo e explicita adulto adicional e filhos", () => {
  assert.match(enhancement, /Seu ingresso e acompanhantes/);
  assert.match(enhancement, /Adicionar adulto\/pessoa adicional/);
  assert.match(enhancement, /adicionar filho/);
  assert.match(enhancement, /removeAttribute\("data-hc-external-hidden"\)/);
  assert.match(migration, /external_single_ticket_required/);
  assert.match(migration, /hc09_external_checkout_guard_not_replaced/);
});

test("HC-10 força estado anônimo no logout e neutraliza troca entre usuários", () => {
  assert.match(enhancement, /event === "SIGNED_OUT"/);
  assert.match(enhancement, /dataset\.hcSignedOut = "true"/);
  assert.match(enhancement, /switchedUser/);
  assert.match(enhancement, /dataset\.hcAuthTransition = "true"/);
  assert.match(enhancement, /restoreHeroButtonsForAnonymousState\(\)/);
  assert.match(enhancement, /hc-hero-user-state-updated/);
});
