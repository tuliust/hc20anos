import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const mobileViewports = [
  { name: "mobile-320x568", width: 320, height: 568 },
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-412x915", width: 412, height: 915 },
];

const publicRoutes = [
  "/",
  "/evento",
  "/ingressos",
  "/quem-vai",
  "/turma",
  "/ex-alunos",
  "/reivindicar-perfil",
  "/nossa-historia",
  "/nossa-historia/memorias",
  "/curiosidades",
  "/mapa",
  "/convite",
  "/pos-festa",
  "/login",
  "/termos",
  "/privacidade",
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(async () => page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  })), { timeout: 20_000 }).toEqual(expect.objectContaining({
    clientWidth: expect.any(Number),
    scrollWidth: expect.any(Number),
  }));

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

for (const viewport of mobileViewports) {
  test.describe(viewport.name, () => {
    for (const route of publicRoutes) {
      test(`${route} permanece dentro da viewport`, async ({ page }, testInfo) => {
        const pageErrors: string[] = [];
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await installHomeFixtures(page);
        await page.goto(route);

        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("main"), pageErrors.join("\n")).toBeVisible({ timeout: 20_000 });
        await expectNoHorizontalOverflow(page);

        const overflowingElements = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          return Array.from(document.querySelectorAll<HTMLElement>("main *"))
            .filter(element => {
              const style = window.getComputedStyle(element);
              if (style.position === "fixed" || style.position === "absolute") return false;
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1);
            })
            .slice(0, 10)
            .map(element => ({
              tag: element.tagName,
              className: element.className,
              text: element.textContent?.trim().slice(0, 80) ?? "",
            }));
        });

        expect(overflowingElements, JSON.stringify(overflowingElements, null, 2)).toEqual([]);

        await page.screenshot({
          path: testInfo.outputPath(`${viewport.name}-${route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-/, "")}.png`),
          fullPage: true,
        });
      });
    }
  });
}
