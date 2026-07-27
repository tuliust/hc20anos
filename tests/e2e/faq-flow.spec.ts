import { expect, test } from "@playwright/test";
import {
  installLegacyFaqFixtures,
  installStructuredFaqFixtures,
} from "./faq-fixtures";

function visibleCategoryNavigation(page: import("@playwright/test").Page) {
  return page
    .locator('[data-home-faq] nav[aria-label="Filtrar dúvidas por categoria"]:visible');
}

test.describe("FAQ público", () => {
  test("usa as tabelas estruturadas, filtra categorias e pesquisa sem depender de acentos", async ({ page }) => {
    await installStructuredFaqFixtures(page);
    await page.goto("/");

    const section = page.locator("[data-home-faq]");
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(section.getByRole("heading", { name: "Perguntas frequentes" })).toBeVisible();

    await expect(section.getByRole("button", { name: "Quando será o reencontro?", exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Como funciona o reembolso?", exact: true })).toHaveCount(0);

    await expect(section.getByRole("button", { name: "Dados e privacidade", exact: true })).toHaveCount(0);
    await expect(section.getByText("Quais dados são publicados?", { exact: true })).toHaveCount(0);

    const generalQuestion = section.getByRole("button", { name: "Quando será o reencontro?", exact: true });
    await expect(generalQuestion).toHaveAttribute("aria-expanded", "false");
    await generalQuestion.click();
    await expect(generalQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(section.getByText("O reencontro será realizado em outubro de 2026.", { exact: true })).toBeVisible();

    const categories = visibleCategoryNavigation(page);
    await categories.getByRole("button", { name: "Pagamentos", exact: true }).click();
    await expect(section.getByRole("button", { name: "Como funciona o reembolso?", exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Quando será o reencontro?", exact: true })).toHaveCount(0);

    const search = section.getByRole("searchbox", { name: "Buscar no FAQ" });
    await search.fill("reembôlso");
    await expect(section.getByRole("status")).toContainText("reembôlso");
    await expect(section.getByRole("button", { name: "Como funciona o reembolso?", exact: true })).toBeVisible();

    await search.fill("pergunta inexistente");
    await expect(section.getByText("Nenhuma dúvida encontrada.", { exact: true })).toBeVisible();
  });

  test("mantém o fallback em faq_items_json quando a estrutura ainda está vazia", async ({ page }) => {
    await installLegacyFaqFixtures(page);
    await page.goto("/");

    const section = page.locator("[data-home-faq]");
    await expect(section).toBeVisible({ timeout: 20_000 });

    const legacyQuestion = section.getByRole("button", { name: "Quando sera?", exact: true });
    await expect(legacyQuestion).toBeVisible();
    await legacyQuestion.click();
    await expect(section.getByText("Em outubro de 2026.", { exact: true })).toBeVisible();
  });
});
