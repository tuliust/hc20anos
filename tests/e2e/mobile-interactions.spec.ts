import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

const faqCategories = [
  { id: "faq-cat-1", event_id: "00000000-0000-0000-0000-000000000001", key: "evento", label: "Evento", description: null, sort_order: 10, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", created_by_admin_id: null, updated_by_admin_id: null, deleted_at: null, deleted_by_admin_id: null },
  { id: "faq-cat-2", event_id: "00000000-0000-0000-0000-000000000001", key: "ingressos", label: "Ingressos", description: null, sort_order: 20, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", created_by_admin_id: null, updated_by_admin_id: null, deleted_at: null, deleted_by_admin_id: null },
  { id: "faq-cat-3", event_id: "00000000-0000-0000-0000-000000000001", key: "privacidade", label: "Dados e Privacidade", description: null, sort_order: 30, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", created_by_admin_id: null, updated_by_admin_id: null, deleted_at: null, deleted_by_admin_id: null },
];

const faqItems = faqCategories.map((category, index) => ({
  id: `faq-item-${index + 1}`,
  event_id: category.event_id,
  category_id: category.id,
  slug: `pergunta-${index + 1}`,
  question: index === 0 ? "Quando será o evento?" : index === 1 ? "Como comprar o ingresso?" : "Como meus dados são usados?",
  answer: index === 0 ? "O evento será em outubro de 2026." : index === 1 ? "A compra é feita pela página de ingressos." : "Os dados seguem as escolhas de privacidade.",
  sort_order: 10,
  is_visible: true,
  is_featured: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by_admin_id: null,
  updated_by_admin_id: null,
  deleted_at: null,
  deleted_by_admin_id: null,
  category,
}));

for (const viewport of viewports) {
  test.describe(`mobile interactions ${viewport.width}x${viewport.height}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
      await installHomeFixtures(page);
      await page.route("**/rest/v1/faq_categories**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(faqCategories) }));
      await page.route("**/rest/v1/faq_items**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(faqItems) }));
      await page.goto("/");
      await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    });

    test("menu público abre sem ultrapassar a viewport", async ({ page }) => {
      const menuButton = page.locator("[data-public-header-menu]");
      await menuButton.click();
      await expect(menuButton).toHaveAttribute("aria-label", "Fechar menu");

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);

      const mobileMenu = page.locator("div.fixed.inset-0.z-40");
      await expect(mobileMenu).toBeVisible();
      const box = await mobileMenu.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("FAQ usa botões compactos e mantém o conteúdo dentro da tela", async ({ page }) => {
      const faq = page.locator("[data-home-faq]");
      await faq.scrollIntoViewIfNeeded();
      await expect(faq).toBeVisible();

      const categoryButtons = faq.locator('nav[aria-label="Filtrar dúvidas por categoria"] button');
      await expect(categoryButtons.first()).toBeVisible();
      expect(await categoryButtons.count()).toBeGreaterThan(1);
      await categoryButtons.nth(1).click();

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(faq.locator("[data-faq-mobile-categories]")).not.toContainText("Dados e Privacidade");
    });

    test("turmas permanecem em quatro colunas e carrossel cabe no card", async ({ page }) => {
      const tabs = page.locator("[data-home-class-tabs]");
      await tabs.scrollIntoViewIfNeeded();
      await expect(tabs).toBeVisible();

      const columns = await tabs.evaluate(element =>
        window.getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length
      );
      expect(columns).toBe(4);

      const people = page.locator("[data-home-class-people]");
      const peopleBox = await people.boundingBox();
      expect(peopleBox?.x).toBeGreaterThanOrEqual(0);
      expect((peopleBox?.x ?? 0) + (peopleBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("rodapé usa composição compacta sem overflow", async ({ page }) => {
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
}
