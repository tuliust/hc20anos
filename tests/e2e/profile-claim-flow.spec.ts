import { expect, test } from "@playwright/test";
import {
  PENDING_PROFILE_CLAIM_KEY,
  TEST_PERSON_ID,
  installAuthenticatedProfileClaimFixtures,
  pendingProfileClaimFixture,
} from "./profile-claim-fixtures";

function inputBelowText(page: import("@playwright/test").Page, text: string) {
  return page.getByText(text, { exact: true }).locator("..").locator("input");
}

function textareaBelowText(page: import("@playwright/test").Page, text: string) {
  return page.getByText(text, { exact: true }).locator("..").locator("textarea");
}

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

  test("gera o perfil com IA sem enviar dados sensíveis e mantém o texto editável", async ({ page }) => {
    await installAuthenticatedProfileClaimFixtures(page);

    let aiRequest: Record<string, any> | null = null;
    const generatedBio = "Maria era conhecida pela comunicação fácil e pela presença marcante na turma. Vinte anos depois, volta ao reencontro pronta para rever pessoas e criar novas memórias.";

    await page.route("**/api/generate-profile-bio", async route => {
      aiRequest = (route.request().postDataJSON() ?? {}) as Record<string, any>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ bio: generatedBio }),
      });
    });

    await page.goto("/reivindicar-perfil");
    await page.getByPlaceholder("Digite seu nome completo...").fill("Maria Cabeção");
    await page.getByRole("button", { name: /Maria Cabeção da Silva Souza/ }).click();
    await page.getByRole("button", { name: /Sim, sou eu/ }).click();

    await inputBelowText(page, "Qual é seu penúltimo sobrenome?").fill("Silva");
    await inputBelowText(page, "Qual era sua turma?").fill("A");
    await inputBelowText(page, "Qual é a sua data de nascimento?").fill("1988-04-03");
    await page.getByRole("button", { name: /Validar identidade/ }).click();

    await expect(page.getByText("Apelido, nickname ou ex-perfil do Fotolog", { exact: true })).toBeVisible();
    await expect(page.getByText("Meu perfil", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Responda 5 perguntas/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Eu vou!", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Não sei ainda...", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Solteiro (a)", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Namorando", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Casado (a)", exact: true })).toBeVisible();
    await expect(page.getByText("A integração com IA será ativada depois", { exact: false })).toHaveCount(0);

    await page.getByRole("button", { name: /Responda 5 perguntas/ }).click();
    await expect(page.getByText("Gerando perfil com IA", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Adorava me comunicar", exact: true }).click();

    for (let step = 0; step < 4; step += 1) {
      await page.getByRole("button", { name: "Continuar", exact: true }).last().click();
    }

    await page.getByRole("button", { name: "Gerar perfil", exact: true }).click();

    await expect(textareaBelowText(page, "Texto do meu perfil")).toHaveValue(generatedBio, { timeout: 20_000 });
    expect(aiRequest).not.toBeNull();
    expect(aiRequest).toMatchObject({
      name: "Maria Cabeção da Silva Souza",
      answers: expect.arrayContaining([
        expect.objectContaining({
          id: "school_personality",
          options: ["Adorava me comunicar"],
        }),
      ]),
    });

    const serializedRequest = JSON.stringify(aiRequest);
    expect(serializedRequest).not.toContain("1988-04-03");
    expect(serializedRequest).not.toContain("claimant@example.com");
    expect(serializedRequest).not.toContain("84999999999");
  });
});
