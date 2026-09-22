import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

async function openDirectory(page: Page) {
  await installHomeFixtures(page);
  await page.goto("/ex-alunos");
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-ex-alumni-summary]")).toBeVisible();
}

async function openDrilldown(page: Page, kind: "bought" | "going" | "registered") {
  const trigger = page.locator(`[data-ex-alumni-drilldown="${kind}"]`);
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const modal = page.locator(`[data-ex-alumni-drilldown-modal="${kind}"]`);
  await expect(modal).toBeVisible();
  return modal;
}

test("Já compraram abre somente pessoas com ingresso aprovado", async ({ page }) => {
  await openDirectory(page);
  const modal = await openDrilldown(page, "bought");

  await expect(modal.locator("[data-person-id]")).toHaveCount(2);
  await expect(modal.locator(`[data-person-id="${peopleFixture[0].id}"]`)).toBeVisible();
  await expect(modal.locator(`[data-person-id="${peopleFixture[1].id}"]`)).toBeVisible();
  await expect(modal.locator(`[data-person-id="${peopleFixture[2].id}"]`)).toHaveCount(0);
});

test("Eu vou exclui quem já possui ingresso aprovado", async ({ page }) => {
  await openDirectory(page);
  const modal = await openDrilldown(page, "going");

  await expect(modal.locator("[data-person-id]")).toHaveCount(3);
  await expect(modal.locator(`[data-person-id="${peopleFixture[0].id}"]`)).toHaveCount(0);
  await expect(modal.locator(`[data-person-id="${peopleFixture[1].id}"]`)).toHaveCount(0);
  await expect(modal.locator(`[data-person-id="${peopleFixture[2].id}"]`)).toBeVisible();
  await expect(modal.locator(`[data-person-id="${peopleFixture[4].id}"]`)).toBeVisible();
});

test("Cadastrados no site usa a regra canônica e permite sobreposição", async ({ page }) => {
  await openDirectory(page);
  const modal = await openDrilldown(page, "registered");

  await expect(modal.locator("[data-person-id]")).toHaveCount(6);
  await expect(modal.locator(`[data-person-id="${peopleFixture[0].id}"]`)).toBeVisible();
  await expect(modal.locator(`[data-person-id="${peopleFixture[5].id}"]`)).toBeVisible();
  await expect(modal.locator(`[data-person-id="${peopleFixture[6].id}"]`)).toHaveCount(0);
});

test("pessoa do drill-down abre o modal individual correto por person_id", async ({ page }) => {
  await openDirectory(page);
  const modal = await openDrilldown(page, "registered");
  const person = peopleFixture[3];

  await modal.locator(`[data-person-id="${person.id}"]`).click();

  await expect(page.locator("[data-ex-alumni-drilldown-modal]")).toHaveCount(0);
  const profileDialog = page.getByRole("dialog", { name: "Perfil da turma" });
  await expect(profileDialog).toBeVisible();
  await expect(profileDialog).toContainText(person.full_name);
});

test("modal fecha por Esc, backdrop e botão, bloqueia scroll e restaura foco", async ({ page }) => {
  await openDirectory(page);
  const trigger = page.locator('[data-ex-alumni-drilldown="bought"]');

  await trigger.focus();
  await trigger.click();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(page.getByRole("button", { name: "Fechar modal" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Já compraram" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

  await trigger.click();
  await page.locator("[data-modal-root='true']").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog", { name: "Já compraram" })).toHaveCount(0);

  await trigger.click();
  await page.getByRole("button", { name: "Fechar modal" }).click();
  await expect(page.getByRole("dialog", { name: "Já compraram" })).toHaveCount(0);
});

test("drill-down permanece utilizável em viewport móvel", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openDirectory(page);
  await openDrilldown(page, "registered");

  const dialog = page.getByRole("dialog", { name: "Cadastrados no site" });
  const geometry = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
});
