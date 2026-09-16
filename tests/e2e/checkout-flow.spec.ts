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

async function seedSelection(page: any) {
  await page.addInitScript(
    ({ selectionKey, ticketTypeId }: { selectionKey: string; ticketTypeId: string }) => {
      window.sessionStorage.setItem(selectionKey, JSON.stringify({
        selectedAt: Date.now(),
        productCode: "simple",
        ticketTypeId,
      }));
    },
    { selectionKey: SELECTION_KEY, ticketTypeId: SIMPLE_TICKET_TYPE_ID },
  );
}

test.describe("catálogo e checkout", () => {
  test("preserva o perfil vinculado, exige termos e envia pedido autenticado", async ({ page }) => {
    const api = await installCommerceFixtures(page);
    await seedSelection(page);
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Participantes e pagamento" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("R$ 120,00", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Lote único", { exact: true })).toBeVisible();

    const submit = page.getByRole("button", { name: "Continuar para pagamento", exact: true });
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
      extras: [],
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

  test("inclui cônjuge e filhos e recalcula o total pela idade", async ({ page }) => {
    const api = await installCommerceFixtures(page);
    await seedSelection(page);
    await page.goto("/checkout");

    await page.getByRole("button", { name: "Adicionar cônjuge" }).click();
    const spouseCard = page.getByText("Cônjuge", { exact: true }).locator("..").locator("..");
    await spouseCard.getByPlaceholder("Nome completo").fill("João Cônjuge");

    await page.getByRole("button", { name: "Adicionar filho(a)" }).click();
    const childCards = page.getByText(/Filho\(a\) 1/);
    await expect(childCards).toHaveCount(1);
    const childCard = childCards.first().locator("..").locator("..");
    await childCard.getByPlaceholder("Nome completo").fill("Criança Teste");
    await childCard.getByLabel("Data de nascimento").fill("2016-09-26");

    await expect(page.getByText("R$ 300,00", { exact: true })).toBeVisible();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar para pagamento", exact: true }).click();
    await expect.poll(() => api.calls.length, { timeout: 20_000 }).toBe(1);

    const participants = api.calls[0].body.participants as Array<Record<string, unknown>>;
    expect(participants).toHaveLength(3);
    expect(participants.map(item => item.participant_type)).toEqual(["alumni", "spouse", "child"]);
    expect(participants[2]).toMatchObject({ full_name: "Criança Teste", birth_date: "2016-09-26" });
  });
});
