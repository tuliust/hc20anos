import { expect, test } from "@playwright/test";
import {
  OPERATION_TICKET_ID,
  installOperationsFixtures,
} from "./operations-fixtures";

test.describe("operação do evento", () => {
  test("redireciona visitante sem sessão para o login", async ({ page }) => {
    await page.goto("/admin/operacao");
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  });

  test("restringe checkin_staff à operação de entrada e vouchers", async ({ page }) => {
    const capture = await installOperationsFixtures(page, "checkin_staff");
    await page.goto("/admin/operacao");

    await expect(page.getByRole("heading", { name: "Check-in", exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Reembolsos", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toHaveCount(0);

    const card = page.locator(".operations-card").filter({ hasText: "Maria Cabeção" });
    await expect(card).toContainText("HC20-CHECKIN-001");
    await card.getByRole("button", { name: "Registrar entrada", exact: true }).click();

    await expect(page.getByText("Check-in registrado.", { exact: true })).toBeVisible();
    await expect(card).toContainText("Entrada registrada");
    expect(capture.checkinCalls).toEqual([
      {
        p_ticket_id: OPERATION_TICKET_ID,
        p_undo: false,
        p_notes: null,
      },
    ]);

    await card.getByRole("button", { name: "Entregar fichas", exact: true }).click();
    await expect(page.getByText("Fichas registradas como entregues.", { exact: true })).toBeVisible();
    expect(capture.voucherCalls).toEqual([
      {
        p_ticket_id: OPERATION_TICKET_ID,
        p_delivered: true,
        p_notes: null,
      },
    ]);
  });

  test("mantém reembolsos e indicadores restritos a admin", async ({ page }) => {
    await installOperationsFixtures(page, "admin");
    await page.goto("/admin/checkin");

    await expect(page.getByRole("heading", { name: "Check-in e reembolsos", exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Indicadores do check-in", exact: true })).toBeVisible();
    await expect(page.getByText("40%", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Reembolsos", exact: true }).click();
    await expect(page.getByText("Participante não poderá comparecer.", { exact: true })).toBeVisible();
    await expect(page.getByText("Reembolso R$ 150,00", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprovar e processar", exact: true })).toBeVisible();
  });
});
