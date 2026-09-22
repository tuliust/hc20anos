import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

async function openCuriosities(page: Page) {
  await installHomeFixtures(page);
  await page.goto("/curiosidades");
  await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-curiosities-summary]")).toBeVisible();
}

async function openDrilldown(page: Page, kind: "alumni" | "cities" | "professions" | "children") {
  await page.locator(`[data-curiosities-drilldown="${kind}"]`).click();
  const modal = page.locator(`[data-curiosities-drilldown-modal="${kind}"]`);
  await expect(modal).toBeVisible();
  return modal;
}

test("amostras dos gráficos são dinâmicas e mantêm universos separados", async ({ page }) => {
  await openCuriosities(page);

  await expect(page.locator("[data-profile-sample]")).toHaveText("Base dos gráficos: 6 pessoas cadastradas no site");
  await expect(page.locator("[data-questionnaire-sample]")).toHaveText("3 pessoas responderam às perguntas adicionais");
});

test("Ex-alunos 2006 abre a base pública viva", async ({ page }) => {
  await openCuriosities(page);
  const modal = await openDrilldown(page, "alumni");

  await expect(modal.locator("[data-curiosity-person-id]")).toHaveCount(8);
  await expect(modal.locator(`[data-curiosity-person-id="${peopleFixture[7].id}"]`)).toBeVisible();
});

test("Cidades agrupa somente pessoas da fonte pública de localização", async ({ page }) => {
  await openCuriosities(page);
  const modal = await openDrilldown(page, "cities");

  await expect(modal).toContainText("Natal");
  await expect(modal.locator("[data-curiosity-person-id]")).toHaveCount(5);
});

test("Áreas profissionais usa a mesma classificação e contagem do gráfico", async ({ page }) => {
  await openCuriosities(page);

  const chartLabel = page.getByText("Outras áreas", { exact: true }).first();
  await expect(chartLabel).toBeVisible();
  await expect(chartLabel.locator("xpath=following-sibling::*[1]")).toHaveText("2");

  const modal = await openDrilldown(page, "professions");
  const area = modal.locator('[data-profession-area="Outras áreas"]');
  await expect(area).toBeVisible();
  await expect(area.locator("[data-curiosity-person-id]")).toHaveCount(2);
  await expect(area).toContainText("2");
});

test("Filhos mostra agregado e quantidade declarada por pessoa", async ({ page }) => {
  await openCuriosities(page);
  const modal = await openDrilldown(page, "children");

  await expect(modal).toContainText("Total agregado");
  await expect(modal).toContainText("5");
  await expect(modal.locator("[data-curiosity-child-person-id]")).toHaveCount(3);
  await expect(modal.locator(`[data-curiosity-child-person-id="${peopleFixture[0].id}"]`)).toContainText("1 filho");
  await expect(modal.locator(`[data-curiosity-child-person-id="${peopleFixture[1].id}"]`)).toContainText("2 filhos");
});

test("pessoa de drill-down abre o modal individual pelo person_id", async ({ page }) => {
  await openCuriosities(page);
  const modal = await openDrilldown(page, "alumni");

  await modal.locator(`[data-curiosity-person-id="${peopleFixture[4].id}"]`).click();

  await expect(page.locator("[data-curiosities-drilldown-modal]")).toHaveCount(0);
  const profile = page.getByRole("dialog", { name: "Perfil da turma" });
  await expect(profile).toBeVisible();
  await expect(profile).toContainText(peopleFixture[4].full_name);
});

test("drill-down de curiosidades funciona em viewport móvel", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openCuriosities(page);
  await openDrilldown(page, "cities");

  const dialog = page.getByRole("dialog", { name: "Cidades onde estão hoje" });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(569);
  expect(box!.width).toBeLessThanOrEqual(320);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
