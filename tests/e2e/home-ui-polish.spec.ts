import { expect, test } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

test("Home: subtítulo do perfil, enquete legível e hover circular nos confirmados", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await installHomeFixtures(page);
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const subtitle = page.locator("[data-home-profile-subtitle]");
  await expect(subtitle).toBeVisible();
  await expect(subtitle).toHaveText("De acordo com as pessoas cadastradas");

  const pollOption = page.locator("[data-home-poll] button").first();
  await expect(pollOption).toBeVisible();
  await expect(pollOption).toHaveCSS("color", "rgb(53, 81, 63)");

  const confirmedPerson = page.locator("[data-home-confirmed-grid] > [data-home-alumni-person]").first();
  await expect(confirmedPerson).toBeVisible({ timeout: 10_000 });
  const avatar = confirmedPerson.locator("img, [role='img']").first();
  await expect(avatar).toBeVisible();

  await confirmedPerson.hover();

  const hoverStyles = await confirmedPerson.evaluate(element => {
    const avatarElement = element.querySelector<HTMLElement>("img, [role='img']");
    if (!avatarElement) throw new Error("Avatar dos confirmados não encontrado");
    return {
      wrapperBoxShadow: getComputedStyle(element).boxShadow,
      avatarBoxShadow: getComputedStyle(avatarElement).boxShadow,
      avatarBorderRadius: getComputedStyle(avatarElement).borderRadius,
    };
  });

  expect(hoverStyles.wrapperBoxShadow).toBe("none");
  expect(hoverStyles.avatarBoxShadow).not.toBe("none");
  expect(parseFloat(hoverStyles.avatarBorderRadius)).toBeGreaterThan(0);
});
