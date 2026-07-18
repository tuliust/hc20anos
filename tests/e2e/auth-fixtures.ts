import type { Page } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

const USER_ID = "00000000-0000-0000-0006-000000000001";

function authUser() {
  return {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "mobile.audit@example.com",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    phone: "",
    confirmed_at: "2026-01-01T00:00:00Z",
    last_sign_in_at: "2026-07-18T12:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Pessoa Mobile" },
    identities: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-18T12:00:00Z",
    is_anonymous: false,
  };
}

export async function installAuthenticatedFixtures(page: Page, admin = false) {
  const adminUser = admin ? {
    id: "00000000-0000-0000-0007-000000000001",
    user_id: USER_ID,
    role: "superadmin",
    display_name: "Pessoa Mobile",
    email: "mobile.audit@example.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  } : null;

  await installHomeFixtures(page, { adminUser });
  await page.route("**/auth/v1/token?grant_type=password", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "playwright-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "playwright-refresh-token",
        user: authUser(),
      }),
    });
  });
}

export async function loginWithFixtures(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("mobile.audit@example.com");
  await page.locator('input[type="password"]').fill("senha-segura");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(url => !url.pathname.endsWith("/login"), { timeout: 20_000 });
}
