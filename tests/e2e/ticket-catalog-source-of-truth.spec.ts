import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const legacyCatalogRows = [{
  lot_id: "10000000-0000-0000-0000-000000000002",
  lot_code: "single",
  lot_name: "Lote único",
  ticket_type_id: "00000000-0000-0000-0001-000000000001",
  product_code: "simple",
  product_name: "Ingresso",
  price_cents: 12000,
  ticket_status: "open",
  available_quantity: 500,
  sold_quantity: 0,
}];

async function installCatalogFixture(page: Page) {
  for (const endpoint of ["get_public_ticket_catalog", "get_current_ticket_catalog"]) {
    await page.route(`**/rest/v1/rpc/${endpoint}`, async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(legacyCatalogRows) });
    });
  }
}

test("Home ignora catálogo legado mesmo se uma fixture retornar produto", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  await expect(page.locator("[data-public-ticket-catalog-home='true']")).toHaveCount(0);
  await expect(page.getByText("R$ 120,00", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Comprar agora", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Comunicado sobre o encontro de 2026/i)).toBeVisible();
});

test("rota /ingressos redireciona e não expõe catálogo", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);
  await page.goto("/ingressos");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("[data-public-ticket-catalog='true']")).toHaveCount(0);
  await expect(page.getByText(/reembolsados integralmente pelo Mercado Pago/i)).toBeVisible({ timeout: 20_000 });
});

test("rota /checkout também permanece fechada sem parâmetros de retorno", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);
  await page.goto("/checkout");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Comprar agora", exact: true })).toHaveCount(0);
});
