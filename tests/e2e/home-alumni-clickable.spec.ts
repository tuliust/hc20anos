import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

async function openHome(page: import("@playwright/test").Page) {
  await installHomeFixtures(page);
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]"), "Home deve concluir o carregamento").toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-home-alumni-overview]"), "Seção de ex-alunos deve estar visível").toBeVisible();
}

test("card Amostra da turma direciona para o diretório", async ({ page }) => {
  await openHome(page);

  const card = page.locator("[data-home-alumni-card='sample']");
  await expect(card).toBeVisible();
  await card.click({ position: { x: 18, y: 18 } });

  await expect(page).toHaveURL(/\/ex-alunos$/);
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible();
});

test("pessoa da amostra abre o mesmo modal existente em Ex-alunos", async ({ page }) => {
  await openHome(page);

  const person = page.locator("[data-home-alumni-card='sample'] [data-home-alumni-person]").first();
  await expect(person).toBeVisible();
  const personName = await person.getAttribute("data-home-alumni-person");
  expect(personName).toBeTruthy();

  await person.click();

  await expect(page).toHaveURL(/\/ex-alunos\?pessoa=/);
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(personName!);
});

test("Confirmados e Pretendem ir ativam os filtros correspondentes", async ({ page }) => {
  await openHome(page);

  await page.locator("[data-home-alumni-presence-filter='confirmed']").click();

  await expect(page).toHaveURL(/\/ex-alunos\?presenca=confirmed/);
  await expect(page.locator("[data-ex-alumni-attendance-filter-applied='confirmed']")).toBeVisible({ timeout: 20_000 });
  const confirmedButton = page.getByRole("button", { name: /Confirmados Compraram o ingresso/i });
  await expect(confirmedButton).toHaveClass(/bg-\[#2d6a4f\]/);
});

test("pessoa do card Turmas abre o perfil com filtro da turma", async ({ page }) => {
  await openHome(page);

  const person = page.locator("[data-home-class-people] [data-home-alumni-person]").first();
  await expect(person).toBeVisible();
  const personName = await person.getAttribute("data-home-alumni-person");
  expect(personName).toBeTruthy();

  await person.click();

  await expect(page).toHaveURL(/\/ex-alunos\?turma=[A-D]&pessoa=/);
  await expect(page.locator("[data-ex-alumni-class-filter-applied]")).toBeVisible({ timeout: 20_000 });
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(personName!);
});
