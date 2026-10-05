import { expect, test, type Page } from "@playwright/test";

function installRuntimeGuards(page: Page) {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  return () => {
    expect(pageErrors, "Erros JavaScript não tratados").toEqual([]);
    expect(serverErrors, "Respostas HTTP 5xx").toEqual([]);
  };
}

async function gotoStable(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("body")).not.toContainText("Não foi possível carregar a Home");
  await expect(page.locator("body")).not.toContainText("Application error");
}

test("Home, Login e reivindicação de perfil estão operacionais", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);

  await gotoStable(page, "/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  await gotoStable(page, "/login");
  await expect(page.getByText("Entrar como ex-aluno", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Criar meu perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/reivindicar-perfil$/);
  await expect(page.getByPlaceholder("Digite seu nome completo...")).toBeVisible({ timeout: 20_000 });

  assertRuntimeClean();
});

test("Stage 3: Curiosidades abre drill-down sem erro", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);

  await gotoStable(page, "/curiosidades");
  await expect(page.getByRole("heading", { name: "O raio-X da Turma 2006" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-curiosities-summary]")).toBeVisible();

  const trigger = page.locator('[data-curiosities-drilldown="alumni"]');
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator('[data-curiosities-drilldown-modal="alumni"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-curiosities-drilldown-modal]")).toHaveCount(0);

  assertRuntimeClean();
});

test("Stage 3: Ex-alunos abre drill-down e fecha por Esc", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);

  await gotoStable(page, "/ex-alunos");
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-ex-alumni-summary]")).toBeVisible();

  const trigger = page.locator('[data-ex-alumni-drilldown="registered"]');
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await expect(page.locator('[data-ex-alumni-drilldown-modal="registered"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-ex-alumni-drilldown-modal]")).toHaveCount(0);

  assertRuntimeClean();
});

test("Stage 3: História abre lightbox interno", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);

  await gotoStable(page, "/nossa-historia");
  await expect(page.getByRole("heading", { name: "Fotos da Época" })).toBeVisible({ timeout: 20_000 });

  const photo = page.locator("[data-history-photo-id]").first();
  await expect(photo).toBeVisible();
  await photo.click();
  await expect(page.locator("[data-history-photo-lightbox]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-history-photo-lightbox]")).toHaveCount(0);

  assertRuntimeClean();
});

test("Comercial encerrado: ingressos e checkout direto retornam à Home", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);

  await gotoStable(page, "/ingressos");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Comprar agora/i })).toHaveCount(0);

  await gotoStable(page, "/checkout");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Continuar para pagamento/i })).toHaveCount(0);

  assertRuntimeClean();
});

test("Viewport móvel não cria overflow horizontal na Home", async ({ page }) => {
  const assertRuntimeClean = installRuntimeGuards(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await gotoStable(page, "/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  assertRuntimeClean();
});
