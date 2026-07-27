import { expect, test } from "@playwright/test";
import {
  TEST_PHOTO_ID,
  TEST_TAG_PERSON_ID,
  installPhotoInteractionsFixtures,
} from "./photo-interactions-fixtures";
import { TEST_USER_ID } from "./profile-claim-fixtures";

test.describe("interações em fotos", () => {
  test("mantém escrita pendente e contratos de privacidade auditáveis", async ({ page }) => {
    const api = await installPhotoInteractionsFixtures(page);

    await page.goto("/nossa-historia");

    await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });
    const galleryPhoto = page.getByRole("img", { name: "Gincana no pátio" }).first();
    await expect(galleryPhoto).toBeVisible();
    await galleryPhoto.click();

    await expect(page).toHaveURL(/\/foto$/);
    await expect(page.getByRole("heading", { name: "Gincana no pátio" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Essa gincana foi inesquecível.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "1 curtidas", exact: true }).click();
    await expect.poll(() => api.likeCalls.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByRole("button", { name: "2 curtidas", exact: true })).toBeVisible();
    expect(api.likeCalls[0]).toMatchObject({
      photo_id: TEST_PHOTO_ID,
      user_id: TEST_USER_ID,
    });

    const commentField = page.locator("textarea").first();
    await expect(commentField).toBeVisible();
    await commentField.fill("Também lembro desse dia.");
    await page.getByRole("button", { name: "Enviar para moderação", exact: true }).click();
    await expect.poll(() => api.commentCalls.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByText("Comentário enviado para moderação.", { exact: true })).toBeVisible();
    expect(api.commentCalls[0]).toMatchObject({
      photo_id: TEST_PHOTO_ID,
      user_id: TEST_USER_ID,
      comment_text: "Também lembro desse dia.",
      status: "pending",
    });

    await page.getByPlaceholder("Marcar alguém da turma...").fill("João");
    await page.getByRole("button", { name: "João Vitor Melo", exact: true }).click();
    await expect.poll(() => api.tagCalls.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByText("Marcação enviada para moderação.", { exact: true })).toBeVisible();
    expect(api.tagCalls[0]).toMatchObject({
      photo_id: TEST_PHOTO_ID,
      person_id: TEST_TAG_PERSON_ID,
      tagged_name_snapshot: "João Vitor Melo",
      status: "pending",
      created_by_user_id: TEST_USER_ID,
    });

    await page.getByRole("button", { name: "Solicitar remoção da foto", exact: true }).click();
    const removalField = page.locator("textarea").last();
    await expect(removalField).toBeVisible();
    await removalField.fill("Apareço na imagem e não autorizo a publicação.");
    await page.getByRole("button", { name: "Enviar solicitação", exact: true }).click();
    await expect.poll(() => api.removalCalls.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByText("Solicitação de remoção enviada.", { exact: true })).toBeVisible();
    expect(api.removalCalls[0]).toMatchObject({
      photo_id: TEST_PHOTO_ID,
      requester_user_id: TEST_USER_ID,
      requester_email: "claimant@example.com",
      reason: "Apareço na imagem e não autorizo a publicação.",
      status: "pending",
    });
  });
});
