import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

const photoId = "00000000-0000-0000-0006-000000000001";

const photoFixture = {
  id: photoId,
  event_id: "00000000-0000-0000-0000-000000000001",
  uploaded_by_user_id: null,
  uploaded_by_name: "Organização",
  image_url: "https://example.com/hc20-photo.jpg",
  thumbnail_url: "https://example.com/hc20-photo-thumb.jpg",
  caption: "Formatura da turma",
  year_approx: 2006,
  location_text: "Pátio do HC",
  status: "approved",
  is_featured: true,
  approved_by_admin_id: null,
  approved_at: "2026-09-20T00:00:00Z",
  created_at: "2026-09-20T00:00:00Z",
  updated_at: "2026-09-20T00:00:00Z",
  photo_tags: [
    {
      person_id: peopleFixture[0].id,
      tagged_name_snapshot: "Marca aprovada",
      status: "approved",
    },
    {
      person_id: peopleFixture[1].id,
      tagged_name_snapshot: "Marca pendente proibida",
      status: "pending",
    },
  ],
};

async function openHistory(page: Page) {
  await page.addInitScript(() => {
    (window as typeof window & { __hcWindowOpenCalls?: number }).__hcWindowOpenCalls = 0;
    window.open = (() => {
      const target = window as typeof window & { __hcWindowOpenCalls?: number };
      target.__hcWindowOpenCalls = (target.__hcWindowOpenCalls ?? 0) + 1;
      return null;
    }) as typeof window.open;
  });
  await installHomeFixtures(page, { photos: [photoFixture] });
  await page.goto("/nossa-historia");
  await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`[data-history-photo-id="${photoId}"]`).first()).toBeVisible();
}

test("foto pública abre lightbox interno e não nova aba", async ({ page }) => {
  await openHistory(page);

  await page.locator(`[data-history-photo-id="${photoId}"]`).first().click();

  const lightbox = page.locator(`[data-history-photo-lightbox="${photoId}"]`);
  await expect(lightbox).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Formatura da turma" })).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __hcWindowOpenCalls?: number }).__hcWindowOpenCalls ?? 0)).toBe(0);
});

test("lightbox mostra legenda, ano, local e somente tags approved", async ({ page }) => {
  await openHistory(page);
  await page.locator(`[data-history-photo-id="${photoId}"]`).first().click();

  const lightbox = page.locator(`[data-history-photo-lightbox="${photoId}"]`);
  await expect(lightbox).toContainText("Formatura da turma");
  await expect(lightbox).toContainText("2006");
  await expect(lightbox).toContainText("Pátio do HC");
  await expect(lightbox).toContainText("Pessoas nesta foto");
  await expect(lightbox.locator(`[data-history-tag-person-id="${peopleFixture[0].id}"]`)).toBeVisible();
  await expect(lightbox.locator(`[data-history-tag-person-id="${peopleFixture[1].id}"]`)).toHaveCount(0);
  await expect(lightbox).not.toContainText("Marca pendente proibida");
});

test("pessoa marcada abre o perfil correto por person_id", async ({ page }) => {
  await openHistory(page);
  await page.locator(`[data-history-photo-id="${photoId}"]`).first().click();

  await page.locator(`[data-history-tag-person-id="${peopleFixture[0].id}"]`).click();

  await expect(page.locator("[data-history-photo-lightbox]")).toHaveCount(0);
  const profile = page.getByRole("dialog", { name: "Perfil da turma" });
  await expect(profile).toBeVisible();
  await expect(profile).toContainText(peopleFixture[0].full_name);
});

test("lightbox fecha por Esc e cabe em viewport móvel", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openHistory(page);
  await page.locator(`[data-history-photo-id="${photoId}"]`).first().click();

  const dialog = page.getByRole("dialog", { name: "Formatura da turma" });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(569);
  expect(box!.width).toBeLessThanOrEqual(320);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
