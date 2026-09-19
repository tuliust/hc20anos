import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const enhancement = readFileSync(new URL("../../src/requestedFollowupsHC050910.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../src/requestedFollowupsHC050910.css", import.meta.url), "utf8");
const externalCopy = readFileSync(new URL("../../src/externalAlumniIntegrationEnhancement.ts", import.meta.url), "utf8");
const homeLanding = readFileSync(new URL("../../src/homeLandingEnhancements.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../supabase/migrations/20260917160137_external_checkout_companions_hc09.sql", import.meta.url), "utf8");
const alumniMigration = readFileSync(new URL("../../supabase/migrations/20260917160153_promote_external_hc2006_alumni.sql", import.meta.url), "utf8");

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

  assert.match(homeLanding, /LEGACY_ANONYMOUS_ATTENDANCE_KEY/);
  assert.match(homeLanding, /if \(!currentUserId\) \{[\s\S]*attendanceConfirmed = false;[\s\S]*clearLegacyAnonymousAttendance\(\)/);
  assert.doesNotMatch(homeLanding, /writeStoredFlag\(LEGACY_ANONYMOUS_ATTENDANCE_KEY, true\)/);
  assert.doesNotMatch(homeLanding, /attendanceConfirmed = readStoredFlag\(LEGACY_ANONYMOUS_ATTENDANCE_KEY\)/);
});

test("todos os inputs de senha recebem controle de visualização acessível", () => {
  assert.match(enhancement, /input\[type="password"\]/);
  assert.match(enhancement, /Mostrar senha/);
  assert.match(enhancement, /Ocultar senha/);
  assert.match(enhancement, /aria-pressed/);
  assert.match(styles, /data-hc-password-toggle/);
});

test("formando HC 2006 vindo do fluxo externo entra na lista da turma", () => {
  assert.match(alumniMigration, /new\.studied_at_hc is true/);
  assert.match(alumniMigration, /new\.class_year = 2006/);
  assert.match(alumniMigration, /person_type = 'alumni'/);
  assert.match(alumniMigration, /is_visible = true/);
  assert.match(alumniMigration, /new\.show_current_photo := true/);
  assert.match(externalCopy, /nome, avatar e perfil/);
});
