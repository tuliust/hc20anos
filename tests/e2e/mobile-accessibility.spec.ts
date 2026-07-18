import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("mobile accessibility safeguards", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installHomeFixtures(page);
  });

  for (const route of ["/", "/login", "/termos", "/privacidade"] as const) {
    test(`${route} suporta texto ampliado sem overflow horizontal`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 20_000 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.waitForTimeout(100);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("movimento reduzido desativa animações prolongadas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

    const duration = await page.locator("[data-home-section='hero']").evaluate(element => {
      const probe = element.querySelector<HTMLElement>("*") ?? element as HTMLElement;
      const style = window.getComputedStyle(probe);
      return {
        animationDuration: style.animationDuration,
        transitionDuration: style.transitionDuration,
      };
    });

    expect(duration.animationDuration === "0.01ms" || duration.animationDuration === "0s").toBeTruthy();
    expect(duration.transitionDuration === "0.01ms" || duration.transitionDuration === "0s").toBeTruthy();
  });

  test("orientação horizontal mantém a Home dentro da viewport", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto("/");
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalOverflow(page);
  });
});
