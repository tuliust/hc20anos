import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const protectedRoutes = [
  "/checkout",
  "/meu-ingresso",
  "/minha-area",
  "/editar-perfil",
  "/admin",
  "/checkin",
] as const;

for (const route of protectedRoutes) {
  test(`${route} redireciona para login sem overflow no mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installHomeFixtures(page);
    await page.goto(route);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Entrar como ex-aluno", { exact: true })).toBeVisible({ timeout: 20_000 });

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
