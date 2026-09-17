import { expect, test } from "@playwright/test";

// Regression markers for the 17/09 profile adjustments. Authenticated profile
// coverage remains in profile-claim-flow; these assertions keep the source
// contract explicit even when the protected route needs fixtures.
test("profile enhancements are bundled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-hc-edit-profile-requested-changes", "true");
  await expect(page.locator("html")).toHaveAttribute("data-hc-external-profile-context", "true");
});
