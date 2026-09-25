import { expect, test } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

async function openHome(page: import("@playwright/test").Page) {
  await installHomeFixtures(page);
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]"), "Home deve concluir o carregamento").toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-home-alumni-overview]"), "Seção de ex-alunos deve estar visível").toBeVisible();
}

function fixtureFullName(personId: string) {
  const person = peopleFixture.find(item => item.id === personId);
  expect(person, `Pessoa de fixture deve existir: ${personId}`).toBeTruthy();
  return person!.full_name;
}

test("shell público desktop ocupa toda a largura sem moldura lateral", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);

  const geometry = await page.evaluate(() => {
    const main = document.querySelector("main");
    const home = document.querySelector("[data-home-loaded]");
    if (!(main instanceof HTMLElement) || !(home instanceof HTMLElement)) return null;
    const mainBox = main.getBoundingClientRect();
    const homeBox = home.getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      mainLeft: mainBox.left,
      mainRight: mainBox.right,
      homeLeft: homeBox.left,
      homeRight: homeBox.right,
    };
  });

  expect(geometry).not.toBeNull();
  expect(Math.abs(geometry!.mainLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry!.homeLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry!.mainRight - geometry!.viewport)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry!.homeRight - geometry!.viewport)).toBeLessThanOrEqual(1);
});

test("nome abreviado na Home abre o modal correto usando o ID estável", async ({ page }) => {
  const people = structuredClone(peopleFixture);
  people[0] = { ...people[0], full_name: "Maria Fernanda Souza de Oliveira", display_name: "Maria Fernanda Souza de Oliveira" };

  await installHomeFixtures(page, { people });
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-home-alumni-overview]")).toBeVisible();

  const person = page.locator(`[data-home-alumni-person-id="${people[0].id}"]`).first();
  await expect(person).toBeVisible();
  await expect(person).toHaveAttribute("data-home-alumni-person", "Maria Oliveira");
  await person.click();

  await expect(page).toHaveURL(new RegExp(`pessoa_id=${people[0].id}`));
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText("Maria Fernanda Souza de Oliveira");
});

test("card Amostra da turma direciona para o diretório", async ({ page }) => {
  await openHome(page);
  const card = page.locator("[data-home-alumni-card='sample']");
  await expect(card).toBeVisible();
  await card.click({ position: { x: 18, y: 18 } });
  await expect(page).toHaveURL(/\/ex-alunos$/);
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible();
});

test("pessoa do Mapa da Turma abre o perfil em Ex-alunos", async ({ page }) => {
  await openHome(page);
  const mapPerson = page.locator("[data-home-map-person]").first();
  await mapPerson.scrollIntoViewIfNeeded();
  await expect(mapPerson).toBeVisible();
  const personId = await mapPerson.getAttribute("data-home-map-person-id");
  expect(personId).toBeTruthy();
  await mapPerson.click();

  await expect(page).toHaveURL(/\/ex-alunos\?/);
  const mapUrl = new URL(page.url());
  expect(mapUrl.searchParams.get("pessoa_id")).toBe(personId);
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(fixtureFullName(personId!));
});

test("diretório não exibe compra, confirmados ou intenção de presença", async ({ page }) => {
  await openHome(page);
  await page.goto("/ex-alunos");
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-ex-alumni-summary]")).toContainText("Cadastrados no site");
  await expect(page.locator("[data-ex-alumni-summary]")).toContainText("Com foto atual");
  await expect(page.locator("[data-ex-alumni-summary]")).toContainText("Cidades representadas");
  await expect(page.getByText("Eu vou!", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Já compraram/i)).toHaveCount(0);
  await expect(page.getByText(/Confirmados.*ingresso/i)).toHaveCount(0);
});

test("filtro de cadastro substitui os filtros de presença", async ({ page }) => {
  await openHome(page);
  await page.goto("/ex-alunos?perfil=registered");
  const registeredButton = page.getByRole("button", { name: /Cadastrados Perfis atualizados no site/i });
  await expect(registeredButton).toHaveClass(/bg-\[#2d6a4f\]/);
  await expect(page.getByRole("button", { name: /Ainda sem perfil Cadastro ainda não concluído/i })).toBeVisible();
});

test("pessoa da amostra abre o mesmo modal existente em Ex-alunos", async ({ page }) => {
  await openHome(page);
  const person = page.locator("[data-home-alumni-card='sample'] [data-home-alumni-person]").first();
  await expect(person).toBeVisible();
  const personId = await person.getAttribute("data-home-alumni-person-id");
  expect(personId).toBeTruthy();
  await person.click();

  await expect(page).toHaveURL(/\/ex-alunos\?/);
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(fixtureFullName(personId!));
});

test("pessoa do card Turmas abre o perfil com filtro da turma", async ({ page }) => {
  await openHome(page);
  const person = page.locator("[data-home-class-people] [data-home-alumni-person]").first();
  await expect(person).toBeVisible();
  const personId = await person.getAttribute("data-home-alumni-person-id");
  expect(personId).toBeTruthy();
  await person.click();

  await expect(page).toHaveURL(/\/ex-alunos\?/);
  const classUrl = new URL(page.url());
  const classGroup = classUrl.searchParams.get("turma");
  expect(classGroup).toMatch(/^[A-D]$/);
  expect(classUrl.searchParams.get("pessoa_id")).toBe(personId);
  const classButton = page.getByRole("button", { name: `Turma ${classGroup}`, exact: true });
  await expect(classButton).toHaveClass(/bg-\[#c9a84c\]/);
  const modal = page.locator("[data-modal-root='true']");
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(fixtureFullName(personId!));
});

test("Home não renderiza grade de confirmados do evento", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("[data-home-confirmed-grid]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Comprar ingresso/i })).toHaveCount(0);
});
