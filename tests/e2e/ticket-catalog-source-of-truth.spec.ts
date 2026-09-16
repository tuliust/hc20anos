import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const catalogRows = [
  {
    lot_id: "10000000-0000-0000-0000-000000000002",
    lot_code: "single",
    lot_name: "Lote único",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-26T17:00:00.000Z",
    lot_capacity: 500,
    ticket_type_id: "00000000-0000-0000-0001-000000000001",
    product_code: "simple",
    product_name: "Ingresso",
    description: "R$ 120 por pessoa, com churrasco incluído. Cada participante leva sua bebida.",
    participant_type: "alumni",
    package_kind: "individual",
    included_people_count: 1,
    metadata_json: { pricing_model: "per_person" },
    price_cents: 12000,
    ticket_status: "open",
    available_quantity: 500,
    sold_quantity: 0,
  },
];

async function installCatalogFixture(page: Page) {
  for (const endpoint of ["get_public_ticket_catalog", "get_current_ticket_catalog"]) {
    await page.route(`**/rest/v1/rpc/${endpoint}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Content-Range": "0-0/1" },
        body: JSON.stringify(catalogRows),
      });
    });
  }
}

test("Home usa nome e preço do lote único", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const catalog = page.locator("[data-public-ticket-catalog-home='true']");
  await expect(catalog).toBeVisible();
  await expect(catalog.locator("article")).toHaveCount(1);
  await expect(catalog).toContainText("LOTE ÚNICO");
  await expect(catalog).toContainText("R$ 120,00");
  await expect(catalog).not.toContainText("Família");
  await expect(catalog).not.toContainText("Convidado");
});

test("Home e página de ingressos exibem o mesmo catálogo", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);

  await page.goto("/");
  await expect(page.locator("[data-public-ticket-catalog-home='true']")).toContainText("R$ 120,00");

  await page.goto("/ingressos");
  const catalog = page.locator("[data-public-ticket-catalog='true']");
  await expect(catalog).toBeVisible({ timeout: 20_000 });
  await expect(catalog.locator("article")).toHaveCount(1);
  await expect(catalog).toContainText("LOTE ÚNICO");
  await expect(catalog).toContainText("R$ 120,00");
});
