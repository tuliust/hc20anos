import { expect, test } from "@playwright/test";
import {
  TEST_POLL_ID,
  TEST_POLL_OPTION_B,
  installEngagementFixtures,
} from "./engagement-fixtures";
import { TEST_USER_ID } from "./profile-claim-fixtures";

test.describe("memórias e enquetes", () => {
  test("preserva anonimato público e envia memória pendente para moderação", async ({ page }) => {
    const api = await installEngagementFixtures(page);

    await page.goto("/nossa-historia/memorias");

    await expect(page.getByRole("heading", { name: "O que ficou daquele tempo?" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("A gincana no pátio ainda rende histórias em todos os encontros.", { exact: false })).toBeVisible();
    await expect(page.getByText("Ana da Turma", { exact: false })).toBeVisible();
    await expect(page.getByText("O corredor principal era o ponto de encontro antes de cada aula.", { exact: false })).toBeVisible();
    await expect(page.getByText("Anônimo", { exact: false })).toBeVisible();
    await expect(page.getByText("Autor Confidencial", { exact: false })).toHaveCount(0);

    const memoryField = page.locator("textarea").first();
    await expect(memoryField).toBeVisible();
    await memoryField.fill("Curta");
    await page.getByRole("button", { name: "Enviar para moderação", exact: true }).click();
    await expect(page.getByText("Escreva uma memória com pelo menos 10 caracteres.", { exact: true })).toBeVisible();
    expect(api.memoryCalls).toHaveLength(0);

    await memoryField.fill("Lembro das conversas no corredor antes da primeira aula.");
    const anonymousControl = page.locator("label").filter({ hasText: "Enviar sem mostrar meu nome" }).getByRole("button");
    await anonymousControl.click();
    await page.getByRole("button", { name: "Enviar para moderação", exact: true }).click();

    await expect.poll(() => api.memoryCalls.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByText("Memória enviada para moderação.", { exact: true })).toBeVisible();
    await expect(memoryField).toHaveValue("");

    expect(api.memoryCalls[0]).toMatchObject({
      event_id: "00000000-0000-0000-0000-000000000001",
      user_id: TEST_USER_ID,
      memory_text: "Lembro das conversas no corredor antes da primeira aula.",
      is_anonymous: true,
      status: "pending",
      is_featured: false,
    });
  });

  test("registra voto único e só exibe resultados depois da participação", async ({ page }) => {
    const api = await installEngagementFixtures(page);

    await page.goto("/curiosidades");

    await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Qual lugar mais representa a turma?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Qual tradição deve voltar no reencontro?" })).toBeVisible();
    await expect(page.getByText("Os resultados serão exibidos depois do seu voto.", { exact: true })).toBeVisible();
    await expect(page.getByText("2 votos", { exact: true })).toHaveCount(0);
    const closedOption = page.getByText("Gincana", { exact: true }).locator("xpath=ancestor::button");
    await expect(closedOption).toBeDisabled();

    await page.getByRole("button", { name: "Corredor principal", exact: true }).click();

    await expect.poll(() => api.pollVoteCalls.length, { timeout: 20_000 }).toBe(1);
    await expect.poll(() => api.pollVoteDeletes, { timeout: 20_000 }).toBe(1);
    await expect(page.getByText("Voto registrado.", { exact: true })).toBeVisible();
    await expect(page.getByText("2 votos", { exact: true })).toBeVisible();

    expect(api.pollVoteCalls[0]).toMatchObject({
      poll_id: TEST_POLL_ID,
      option_id: TEST_POLL_OPTION_B,
      user_id: TEST_USER_ID,
    });
    const selectedOption = page.getByText("Corredor principal", { exact: true }).locator("xpath=ancestor::button");
    await expect(selectedOption).toBeDisabled();
  });
});
