import { expect, test } from "@playwright/test";
import { installCommerceFixtures } from "./commerce-fixtures";

test.describe("comércio encerrado após cancelamento", () => {
  test("checkout direto sem retorno de pagamento redireciona para a Home", async ({ page }) => {
    const api = await installCommerceFixtures(page);
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Comprar agora/i })).toHaveCount(0);
    expect(api.calls).toHaveLength(0);
  });

  test("rota de ingressos não oferece nova compra", async ({ page }) => {
    await installCommerceFixtures(page);
    await page.goto("/ingressos");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Comprar agora/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Continuar para pagamento/i })).toHaveCount(0);
    await expect(page.locator("[data-public-ticket-catalog='true']")).toHaveCount(0);
  });
});
