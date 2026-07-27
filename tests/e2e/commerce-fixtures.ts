import type { Page, Route } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";
import {
  TEST_PERSON_ID,
  TEST_PROFILE_ID,
  TEST_USER_ID,
  installAuthenticatedProfileClaimFixtures,
} from "./profile-claim-fixtures";

export const SIMPLE_TICKET_TYPE_ID = "00000000-0000-0000-0001-000000000001";

export const commerceCatalogRows = [
  {
    lot_id: "10000000-0000-0000-0000-000000000002",
    lot_code: "lot_2",
    lot_name: "2º Lote Administrativo",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-01T02:59:59.000Z",
    lot_capacity: 300,
    ticket_type_id: SIMPLE_TICKET_TYPE_ID,
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

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type CheckoutRequestCapture = {
  calls: Array<{
    body: Record<string, unknown>;
    headers: Record<string, string>;
  }>;
};

export async function installCommerceFixtures(page: Page): Promise<CheckoutRequestCapture> {
  await installAuthenticatedProfileClaimFixtures(page);
  await installHomeFixtures(page);

  await page.route("**/rest/v1/rpc/get_public_ticket_catalog", route => fulfillJson(route, commerceCatalogRows));
  await page.route("**/rest/v1/rpc/get_current_ticket_catalog", route => fulfillJson(route, commerceCatalogRows));
  await page.route("**/rest/v1/ticket_types*", route => fulfillJson(route, [{ id: SIMPLE_TICKET_TYPE_ID }]));
  await page.route("**/rest/v1/profiles*", route => fulfillJson(route, {
    id: TEST_PROFILE_ID,
    user_id: TEST_USER_ID,
    person_id: TEST_PERSON_ID,
    display_name: "Maria Cabeção",
    contact_email: "CLAIMANT@EXAMPLE.COM",
    contact_whatsapp: "84999999999",
    people: { full_name: "Maria Cabeção da Silva Souza" },
  }));

  const calls: CheckoutRequestCapture["calls"] = [];
  await page.route("**/api/checkout-create", async route => {
    const request = route.request();
    calls.push({
      body: (request.postDataJSON() ?? {}) as Record<string, unknown>,
      headers: request.headers(),
    });
    await fulfillJson(route, {
      checkout_url: "/pagamento-simulado?preference=test-preference",
      public_token: "public-token-test",
      expires_at: "2026-07-27T13:30:00.000Z",
    });
  });

  return { calls };
}
