import { expect, test } from "@playwright/test";
import { installEngagementFixtures } from "./engagement-fixtures";

const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test.describe("Fase 2 — conteúdo e Storage", () => {
  test("reencoda imagem e entrega arquivo raster sem metadados", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async base64 => {
      const module = await import("/src/lib/imageUploadSecurity.ts");
      const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
      const input = new File([bytes], "foto original.png", { type: "image/png" });
      const prepared = await module.prepareImageForUpload(input, {
        outputMimeType: "image/webp",
        maxDimension: 1024,
        maxPixels: 1_000_000,
      });
      return {
        name: prepared.file.name,
        type: prepared.file.type,
        size: prepared.file.size,
        width: prepared.inspection.width,
        height: prepared.inspection.height,
        hasSensitiveMetadata: prepared.inspection.hasSensitiveMetadata,
      };
    }, PNG_BASE64);

    expect(result.name).toMatch(/foto-original-segura\.(webp|jpg)$/);
    expect(["image/webp", "image/jpeg"]).toContain(result.type);
    expect(result.size).toBeGreaterThan(0);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(result.hasSensitiveMetadata).toBe(false);
  });

  test("controle de anonimato pertence ao React e preserva a escolha", async ({ page }) => {
    await installEngagementFixtures(page);
    await page.goto("/nossa-historia/memorias");
    const control = page.getByRole("switch", { name: "Enviar sem mostrar meu nome" });
    await expect(control).toBeVisible({ timeout: 20_000 });
    await expect(control).toHaveAttribute("aria-checked", "false");
    await control.click();
    await expect(control).toHaveAttribute("aria-checked", "true");
    await page.waitForTimeout(500);
    await expect(control).toHaveAttribute("aria-checked", "true");
    await control.press("Space");
    await expect(control).toHaveAttribute("aria-checked", "false");
  });
});
