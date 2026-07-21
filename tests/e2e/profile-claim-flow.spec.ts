import { expect, test } from "@playwright/test";
import {
  PENDING_PROFILE_CLAIM_KEY,
  TEST_PERSON_ID,
  installAuthenticatedProfileClaimFixtures,
  pendingProfileClaimFixture,
} from "./profile-claim-fixtures";

test.describe("reivindicação de perfil", () => {
  test("retoma automaticamente a reivindicação após a confirmação do e-mail e o login", async ({ page }) => {
    const api = await installAuthenticatedProfileClaimFixtures(page, {
      pendingClaim: pendingProfileClaimFixture(),
    });

    await page.goto("/reivindicar-perfil");

    await expect.poll(() => api.registrationCalls.length, { timeout: 20_000 }).toBe(1);
    expect(api.registrationCalls[0]).toMatchObject({
      p_person_id: TEST_PERSON_ID,
      p_penultimate_surname: "Silva",
      p_class_group_confirmation: "A",
      p_declared_birth_date: "1988-04-03",
    });

    await expect.poll(
      () => page.evaluate(key => window.localStorage.getItem(key), PENDING_PROFILE_CLAIM_KEY),
      { timeout: 20_000 },
    ).toBeNull();
  });

  test("abre a aba de disputas pela URL e exibe evidências atuais e legadas", async ({ page }) => {
    await installAuthenticatedProfileClaimFixtures(page, { admin: true });

    await page.goto("/admin/participants?tab=disputes");

    await expect(page).toHaveURL(/\/admin\/participants\?tab=disputes$/);
    await expect(page.getByText("Disputas de perfil", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Data declarada: 03\/04\/1988/)).toBeVisible();
    await expect(page.getByText(/Usuário: claimant@example\.com/)).toBeVisible();
    await expect(page.getByText("Data não registrada — reivindicação anterior a esta atualização", { exact: false })).toBeVisible();
  });
});
