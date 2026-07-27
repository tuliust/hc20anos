import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const catalogRows = [
  {
    lot_id: "10000000-0000-0000-0000-000000000002",
    lot_code: "lot_2",
    lot_name: "2º Lote Administrativo",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-01T02:59:59.000Z",
    lot_capacity: 300,
    ticket_type_id: "00000000-0000-0000-0001-000000000001",
    product_code: "simple",
    product_name: "Ingresso Ex-Aluno",
    description: null,
    participant_type: "alumni",
    package_kind: "individual",
    included_people_count: 1,
    metadata_json: {},
    price_cents: 15900,
    ticket_status: "open",
    available_quantity: 200,
    sold_quantity: 20,
  },
  {
    lot_id: "10000000-0000-0000-0000-000000000002",
    lot_code: "lot_2",
    lot_name: "2º Lote Administrativo",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-01T02:59:59.000Z",
    lot_capacity: 300,
    ticket_type_id: "00000000-0000-0000-0001-000000000002",
    product_code: "family_full",
    product_name: "Ingresso Família Completa",
    description: null,
    participant_type: "alumni",
    package_kind: "family",
    included_people_count: 2,
    metadata_json: {},
    price_cents: 27900,
    ticket_status: "open",
    available_quantity: 100,
    sold_quantity: 8,
  },
  {
    lot_id: "10000000-0000-0000-0000-000000000002",
    lot_code: "lot_2",
    lot_name: "2º Lote Administrativo",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-01T02:59:59.000Z",
    lot_capacity: 300,
    ticket_type_id: "00000000-0000-0000-0001-000000000003",
    product_code: "external_guest",
    product_name: "Ingresso Convidado",
    description: null,
    participant_type: "external_guest",
    package_kind: "individual",
    included_people_count: 1,
    metadata_json: {},
    price_cents: 18900,
    ticket_status: "open",
    available_quantity: 50,
    sold_quantity: 4,
  },
];

async function installCatalogFixture(page: Page) {
  await page.route("**/rest/v1/rpc/get_public_ticket_catalog", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Content-Range": "0-2/3" },
      body: JSON.stringify(catalogRows),
    });
  });

  await page.route("**/rest/v1/rpc/get_current_ticket_catalog", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Content-Range": "0-2/3" },
      body: JSON.stringify(catalogRows),
    });
  });
}

// O mount da Home deve preferir o marcador estável `data-home-section="tickets"`.
test("Home usa nome e preços do lote vigente", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const catalog = page.locator("[data-public-ticket-catalog-home='true']");
  await expect(catalog).toBeVisible();
  await expect(catalog.locator("article")).toHaveCount(3);
  await expect(catalog).toContainText("2º LOTE ADMINISTRATIVO");
  await expect(catalog).toContainText("R$ 159,00");
  await expect(catalog).toContainText("R$ 279,00");
  await expect(catalog).toContainText("R$ 189,00");
  await expect(catalog).not.toContainText("LOTE 1");
});

test("Home e página de ingressos exibem o mesmo catálogo", async ({ page }) => {
  await installHomeFixtures(page);
  await installCatalogFixture(page);

  await page.goto("/");
  await expect(page.locator("[data-public-ticket-catalog-home='true']")).toContainText("R$ 159,00");

  await page.goto("/ingressos");
  const catalog = page.locator("[data-public-ticket-catalog='true']");
  await expect(catalog).toBeVisible({ timeout: 20_000 });
  await expect(catalog.locator("article")).toHaveCount(3);
  await expect(catalog).toContainText("2º LOTE ADMINISTRATIVO");
  await expect(catalog).toContainText("R$ 159,00");
  await expect(catalog).toContainText("R$ 279,00");
  await expect(catalog).toContainText("R$ 189,00");
});
