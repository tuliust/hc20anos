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

async function installCatalogFixture(page: Page, rows = catalogRows) {
  for (const endpoint of ["get_public_ticket_catalog", "get_current_ticket_catalog"]) {
    await page.route(`**/rest/v1/rpc/${endpoint}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Content-Range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` },
        body: JSON.stringify(rows),
      });
    });
  }
}

test("Home usa nome, preço e CTA padronizados do lote único", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const catalog = page.locator("[data-public-ticket-catalog-home='true']");
  await expect(catalog).toBeVisible();
  await expect(catalog.locator("article")).toHaveCount(1);

  const card = catalog.locator("article").first();
  await expect(card.getByText("LOTE ÚNICO", { exact: true })).toBeVisible();
  await expect(card.getByRole("heading", { name: "Ingresso", exact: true })).toBeVisible();
  await expect(card.getByText("Compra segura pelo Mercado Pago.", { exact: true })).toBeVisible();
  await expect(card.getByText("R$ 120,00", { exact: true })).toBeVisible();
  await expect(card.getByText("Disponível", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Comprar agora", exact: true })).toBeVisible();
  await expect(catalog).not.toContainText("Família");
  await expect(catalog).not.toContainText("Convidado");
});

test("Home preserva o rótulo do lote ativo fornecido pelo catálogo", async ({ page }) => {
  await installHomeFixtures(page);
  const renamedLotRows = catalogRows.map(row => ({ ...row, lot_code: "reencontro", lot_name: "Lote Reencontro" }));
  await installCatalogFixture(page, renamedLotRows);

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const homeCatalog = page.locator("[data-public-ticket-catalog-home='true']");
  await expect(homeCatalog).toContainText("LOTE REENCONTRO");
  await expect(page.locator("[data-home-ticket-amenities]")).toContainText("Lote Reencontro");

  await page.goto("/ingressos");
  const ticketsCatalog = page.locator("[data-public-ticket-catalog='true']");
  await expect(ticketsCatalog).toBeVisible({ timeout: 20_000 });
  await expect(ticketsCatalog).toContainText("LOTE REENCONTRO");
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
