import { expect, test } from "@playwright/test";
import {
  SIMPLE_TICKET_TYPE_ID,
  installCommerceFixtures,
} from "./commerce-fixtures";
import {
  TEST_PERSON_ID,
  TEST_USER_ID,
} from "./profile-claim-fixtures";

const SELECTION_KEY = "hc-checkout-ticket-selected";

test.describe("catálogo e checkout", () => {
  test("usa a seleção vigente e envia um pedido normalizado e autenticado", async ({ page }) => {
    const api = await installCommerceFixtures(page);

    await page.addInitScript(
      ({ selectionKey, ticketTypeId }) => {
        window.sessionStorage.setItem(selectionKey, JSON.stringify({
          selectedAt: Date.now(),
          productCode: "simple",
          ticketTypeId,
        }));
      },
      { selectionKey: SELECTION_KEY, ticketTypeId: SIMPLE_TICKET_TYPE_ID },
    );

    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toBeVisible({ timeout: 20_000 });
    const checkoutPrices = page.getByText("R$ 159,00", { exact: true });
    await expect(checkoutPrices).toHaveCount(2);
    await expect(checkoutPrices.first()).toBeVisible();
    await expect(page.getByText("2º Lote Administrativo", { exact: true })).toBeVisible();

    const submit = page.getByRole("button", { name: "Ir para o Mercado Pago", exact: true });
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();

    await expect(page.getByText("Aceite os Termos de Uso e a Política de Privacidade.", { exact: true })).toBeVisible();
    expect(api.calls).toHaveLength(0);

    await page.getByRole("checkbox").check();
    await submit.click();

    await expect.poll(() => api.calls.length, { timeout: 20_000 }).toBe(1);
    await expect(page).toHaveURL(/\/pagamento-simulado\?preference=test-preference$/);

    const [{ body, headers }] = api.calls;
    expect(headers.authorization).toMatch(/^Bearer\s+.+/);
    expect(headers.apikey).toBeTruthy();
    expect(headers["idempotency-key"]).toBeTruthy();

    expect(body).toMatchObject({
      buyer_name: "Maria Cabeção",
      buyer_email: "claimant@example.com",
      buyer_phone: "84999999999",
      product_code: "simple",
      participants: [
        expect.objectContaining({
          participant_type: "alumni",
          full_name: "Maria Cabeção",
          email: "claimant@example.com",
          person_id: TEST_PERSON_ID,
          user_id: TEST_USER_ID,
        }),
      ],
    });

    expect(body.idempotency_key).toBe(headers["idempotency-key"]);
    expect(body).not.toHaveProperty("price_cents");
    expect(body).not.toHaveProperty("total_amount_cents");
    expect(body).not.toHaveProperty("ticket_type_id");
  });
});
