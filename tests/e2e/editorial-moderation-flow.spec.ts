import { expect, test } from "@playwright/test";
import {
  TEST_PENDING_COMMENT_ID,
  TEST_PENDING_MEMORY_ID,
  TEST_USER_ID,
  installEditorialModerationFixtures,
} from "./editorial-moderation-fixtures";

test.describe("moderação editorial", () => {
  test("aprova memória anônima sem revelar autoria pública", async ({ page }) => {
    const api = await installEditorialModerationFixtures(page);

    await page.goto("/admin/content?tab=memories");

    await expect(page.getByText("A biblioteca era nosso refúgio nos intervalos mais tranquilos.", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Anônimo · 2026-07-25/)).toBeVisible();
    await expect(page.getByText("Autora protegida", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Aprovar", exact: true }).click();

    await expect.poll(() => api.memoryPatches.length, { timeout: 20_000 }).toBe(1);
    expect(api.memoryPatches[0]).toMatchObject({
      status: "approved",
      approved_by_admin_id: TEST_USER_ID,
    });
    await expect(page.getByText("A biblioteca era nosso refúgio nos intervalos mais tranquilos.", { exact: true })).toHaveCount(0);
    expect(api.auditCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: "memory_approved",
        entity_type: "memories",
        entity_id: TEST_PENDING_MEMORY_ID,
      }),
    ]));
  });

  test("rejeita comentário pendente e registra auditoria", async ({ page }) => {
    const api = await installEditorialModerationFixtures(page);

    await page.goto("/admin/content?tab=comments");

    await expect(page.getByText("Comentário aguardando revisão editorial.", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Comentador de teste · Gincana no pátio · 2026-07-25/)).toBeVisible();

    await page.getByRole("button", { name: "Rejeitar", exact: true }).click();

    await expect.poll(() => api.commentPatches.length, { timeout: 20_000 }).toBe(1);
    expect(api.commentPatches[0]).toMatchObject({
      status: "rejected",
      approved_by_admin_id: TEST_USER_ID,
      approved_at: null,
    });
    await expect(page.getByText("Comentário aguardando revisão editorial.", { exact: true })).toHaveCount(0);
    expect(api.auditCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: "photo_comment_rejected",
        entity_type: "photo_comments",
        entity_id: TEST_PENDING_COMMENT_ID,
      }),
    ]));
  });
});
