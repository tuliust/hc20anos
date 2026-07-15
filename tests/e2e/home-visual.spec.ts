import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const viewports = [
  { name: "mobile-320x568", width: 320, height: 568 },
  { name: "mobile-375x667", width: 375, height: 667 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-430x932", width: 430, height: 932 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "desktop-1366x768", width: 1366, height: 768 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: Home sem overflow e componentes restaurados visíveis`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await installHomeFixtures(page);
    await page.goto("/");
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("[data-public-header]")).toBeVisible();
    await expect(page.locator("[data-home-section='hero']")).toBeVisible();
    await expect(page.locator("[data-home-alumni-overview]")).toBeVisible();
    await expect(page.locator("[data-home-nostalgia-timeline]")).toBeVisible();
    await expect(page.getByText("Nossa historia em imagens", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-home-section='info']")).toBeVisible();
    await expect(page.locator("[data-home-event-cta]")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const headerBox = await page.locator("[data-public-header]").boundingBox();
    const menuBox = viewport.width < 768 ? await page.locator("[data-public-header-menu]").boundingBox() : null;
    expect(headerBox?.width).toBeLessThanOrEqual(viewport.width);
    if (menuBox) expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width);

    await page.locator("[data-home-section='hero']").screenshot({ path: testInfo.outputPath(`${viewport.name}-hero.png`) });
    await page.locator("[data-home-alumni-overview]").screenshot({ path: testInfo.outputPath(`${viewport.name}-overview.png`) });
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-full.png`), fullPage: true });
  });
}
