import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

for (const viewport of viewports) {
  test.describe(`mobile interactions ${viewport.width}x${viewport.height}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
      await installHomeFixtures(page);
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
