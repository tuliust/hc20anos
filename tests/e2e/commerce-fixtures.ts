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
    lot_code: "single",
    lot_name: "Lote único",
    lot_starts_at: "2026-07-01T03:00:00.000Z",
    lot_ends_at: "2026-09-26T17:00:00.000Z",
    lot_capacity: 500,
    ticket_type_id: SIMPLE_TICKET_TYPE_ID,
    product_code: "simple",
    product_name: "Ingresso",
    description: "R$ 120 por pessoa, com churrasco incluído. Cada participante leva sua bebida.",
    participant_type: "alumni",
    package_kind: "individual",
    included_people_count: 1,
    metadata_json: {
      pricing_model: "per_person",
      adult_price_cents: 12000,
      spouse_price_cents: 12000,
      child_free_max_age: 8,
      child_half_min_age: 9,
      child_half_max_age: 12,
      child_half_price_cents: 6000,
      child_full_min_age: 13,
      barbecue_included: true,
      beverages_included: false,
    },
    price_cents: 12000,
    ticket_status: "open",
    available_quantity: 500,
    sold_quantity: 0,
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
      expires_at: "2026-09-16T13:30:00.000Z",
      consent_required: true,
    });
  });

  return { calls };
}
