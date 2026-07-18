import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  const overflowingElements = overflow > 1 ? await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (
          rect.left < -1 ||
          rect.right > viewportWidth + 1 ||
          element.scrollWidth > element.clientWidth + 1
        );
      })
      .slice(0, 12)
      .map(element => ({
        tag: element.tagName,
        data: Array.from(element.attributes).filter(attribute => attribute.name.startsWith("data-")).map(attribute => attribute.name).join(","),
        className: `${typeof element.className === "string" ? element.className : ""} [${element.clientWidth}/${element.scrollWidth}]`,
        text: element.textContent?.trim().slice(0, 80) ?? "",
      }));
    const htmlRect = document.documentElement.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    return [{
      tag: "DOCUMENT",
      data: "",
      className: `html ${htmlRect.width}x${document.documentElement.scrollWidth}; body ${bodyRect.left}..${bodyRect.right} (${bodyRect.width})`,
      text: getComputedStyle(document.body).width,
    }, ...elements];
  }) : [];
  expect(overflow, JSON.stringify(overflowingElements, null, 2)).toBeLessThanOrEqual(1);
}

test.describe("mobile accessibility safeguards", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installHomeFixtures(page);
  });

  for (const route of ["/", "/login", "/termos", "/privacidade"] as const) {
    test(`${route} suporta texto ampliado sem overflow horizontal`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 20_000 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.waitForTimeout(100);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("movimento reduzido desativa animações prolongadas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

    const result = await page.evaluate(() => {
      const toMilliseconds = (value: string) => value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => item.endsWith("ms") ? Number.parseFloat(item) : Number.parseFloat(item) * 1000)
        .filter(Number.isFinite);

      const probe = document.createElement("div");
      probe.style.animationName = "mobile-reduced-motion-probe";
      probe.style.animationDuration = "2s";
      probe.style.animationIterationCount = "infinite";
      probe.style.transitionProperty = "opacity";
      probe.style.transitionDuration = "2s";
      document.body.appendChild(probe);

      const style = window.getComputedStyle(probe);
      const animationDurations = toMilliseconds(style.animationDuration);
      const transitionDurations = toMilliseconds(style.transitionDuration);
      const animationIterations = style.animationIterationCount
        .split(",")
        .map(item => item.trim());
      probe.remove();

      return {
        reducedMotionMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        maximumAnimationDurationMs: Math.max(0, ...animationDurations),
        maximumTransitionDurationMs: Math.max(0, ...transitionDurations),
        animationIterations,
      };
    });

    expect(result.reducedMotionMatches).toBe(true);
    expect(result.maximumAnimationDurationMs).toBeLessThanOrEqual(0.01);
    expect(result.maximumTransitionDurationMs).toBeLessThanOrEqual(0.01);
    expect(result.animationIterations.every(value => value === "1")).toBe(true);
  });

  test("orientação horizontal mantém a Home dentro da viewport", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto("/");
    await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalOverflow(page);
  });
});
