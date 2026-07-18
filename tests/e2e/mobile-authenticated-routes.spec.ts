import { expect, test, type Page } from "@playwright/test";
import { installAuthenticatedFixtures, loginWithFixtures } from "./auth-fixtures";

async function expectMobileLayout(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const undersizedInteractiveElements = await page.locator(
    "main button:visible, main a:visible, main input:not([type=radio]):not([type=checkbox]):visible, main select:visible, [data-admin-root] button:visible"
  ).evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  }).map(element => {
    const rect = element.getBoundingClientRect();
    return `${element.tagName.toLowerCase()} "${element.textContent?.trim() ?? ""}" ${Math.round(rect.width)}x${Math.round(rect.height)}`;
  }));
  expect(undersizedInteractiveElements).toEqual([]);
}

for (const route of ["/checkout", "/meu-ingresso", "/minha-area", "/editar-perfil"] as const) {
  test(`${route} funciona autenticada sem overflow e com alvos de toque adequados`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installAuthenticatedFixtures(page);
    await loginWithFixtures(page);
    await page.goto(route);

    await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
    await expect(page.locator("[data-app-main]")).toBeVisible({ timeout: 20_000 });
    await expectMobileLayout(page);
  });
}

test("/admin oferece navegação mobile própria para usuário autenticado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAuthenticatedFixtures(page, true);
  await loginWithFixtures(page);
  await page.goto("/admin");

  await expect(page.locator("[data-admin-root]")).toBeVisible({ timeout: 20_000 });
  const trigger = page.locator("[data-admin-mobile-navigation-trigger]");
  await expect(trigger).toContainText("Dashboard");
  await trigger.click();
  await expect(page.locator("[data-admin-mobile-navigation]")).toBeVisible();
  await expect(page.locator("[data-admin-mobile-subtabs]")).toContainText("Visão geral");
  await expectMobileLayout(page);
});

test("/checkin funciona autenticada e mantém o QR Code dentro da viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAuthenticatedFixtures(page, true);
  await loginWithFixtures(page);
  await page.goto("/checkin");

  await expect(page).toHaveURL(/\/checkin$/);
  await expect(page.getByText("Check-in", { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  await expectMobileLayout(page);
});
