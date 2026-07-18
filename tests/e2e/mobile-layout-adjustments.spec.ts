import { expect, test, type Page } from "@playwright/test";
import { installAuthenticatedFixtures, loginWithFixtures } from "./auth-fixtures";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

const mobileViewports = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

async function openFixtureHome(page: Page, viewport = mobileViewports[2]) {
  await page.setViewportSize(viewport);
  await installHomeFixtures(page);
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
}

for (const viewport of mobileViewports) {
  test(`hero, menu e tabs do mapa cabem em ${viewport.width}px`, async ({ page }) => {
    await openFixtureHome(page, viewport);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.locator("[data-public-header-menu]").click();
    const menuMetrics = await page.locator("[data-public-mobile-menu]").evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(menuMetrics.scrollHeight).toBeLessThanOrEqual(menuMetrics.clientHeight + 1);
    await expect(page.locator("[data-mobile-primary-nav] > button")).toHaveCount(6);
    await page.locator("[data-public-header-menu]").click();

    const tabs = page.locator("[data-map-level-tabs]").first();
    await tabs.scrollIntoViewIfNeeded();
    const tabBoxes = await tabs.locator("button").evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { top: Math.round(rect.top), whiteSpace: getComputedStyle(button).whiteSpace };
    }));
    expect(new Set(tabBoxes.map(box => box.top)).size).toBe(1);
    expect(tabBoxes.every(box => box.whiteSpace === "nowrap")).toBe(true);
  });
}

test("seta da Hero usa scroll suave e leva à seção seguinte", async ({ page }) => {
  await openFixtureHome(page);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");
  await page.locator("[data-home-hero-next]").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect.poll(() => page.locator("#home-about").evaluate(element => Math.round(element.getBoundingClientRect().top))).toBeLessThan(90);
});

test("timeline abre o item ao cruzar o centro e mantém apenas um expandido", async ({ page }) => {
  await openFixtureHome(page);
  const items = page.locator("[data-home-nostalgia-timeline] [data-timeline-index]");
  await expect(items).toHaveCount(3);
  await items.nth(1).evaluate(element => element.scrollIntoView({ block: "center" }));
  await expect(items.nth(1)).toHaveAttribute("data-timeline-active", "true");
  await expect(page.locator("[data-home-nostalgia-timeline] [data-timeline-active='true']")).toHaveCount(1);
  const top = await items.nth(1).evaluate(element => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(100);
});

test("badges DISPONÍVEL e ABERTO ficam em uma linha e acima do título no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installHomeFixtures(page);
  await page.route("**/rest/v1/ticket_types**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{
    id: "ticket-mobile", event_id: "00000000-0000-0000-0000-000000000001", name: "Ingresso Individual — 1º Lote", description: null,
    price_cents: 12000, available_quantity: 100, sold_quantity: 20, status: "open", is_visible: true, max_per_order: 4,
  }]) }));

  await page.goto("/ingressos");
  const available = page.locator("[data-ticket-page-mobile-heading] [data-status-badge='available']");
  await expect(available).toBeVisible();
  await expect(available).toHaveCSS("white-space", "nowrap");

  await page.goto("/curiosidades");
  const openBadge = page.locator("[data-poll-card] [data-status-badge='open']").first();
  await expect(openBadge).toBeVisible({ timeout: 20_000 });
  await expect(openBadge).toHaveCSS("white-space", "nowrap");
  const positions = await page.locator("[data-poll-card-heading]").first().evaluate(element => {
    const badge = element.querySelector<HTMLElement>("[data-poll-status]")!;
    const title = element.querySelector<HTMLElement>("h3")!;
    return { badge: badge.getBoundingClientRect().top, title: title.getBoundingClientRect().top };
  });
  expect(positions.badge).toBeLessThan(positions.title);
});

test("filtros de ex-alunos são compactos e nomes aceitam duas linhas", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installHomeFixtures(page, { people: peopleFixture.map((person, index) => index === 0 ? { ...person, display_name: "Maria Eduarda Albuquerque de Vasconcelos" } : person) });
  await page.goto("/ex-alunos");

  const classFilters = page.locator("[data-alumni-class-filters] button");
  await expect(classFilters).toHaveText(["Todas", "Turma A", "Turma B", "Turma C", "Turma D"]);
  const classTops = await classFilters.evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().top)));
  expect(new Set(classTops).size).toBe(1);
  await expect(page.locator("[data-alumni-status-filters] button")).toHaveText(["Ex-alunos", "Cadastrados", "Compraram", "Eu vou!"]);
  await expect(page.locator("[data-alumni-name]").first()).toHaveCSS("-webkit-line-clamp", "2");
});

test("Nossa História mantém ações lado a lado e oferece multiselect de anos e pessoas", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installHomeFixtures(page);
  await page.goto("/nossa-historia");

  const actions = page.locator("[data-history-actions] button");
  await expect(actions).toHaveText(["Memórias", "Enviar foto"]);
  const actionTops = await actions.evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().top)));
  expect(new Set(actionTops).size).toBe(1);
  await expect(page.getByText(/fotos selecionadas pela organização/i)).toHaveCount(0);

  await page.locator("[data-year-multiselect] > button").click();
  await expect(page.locator("[data-year-multiselect]")).toContainText("Todos os anos");
  for (const year of ["2003", "2004", "2005", "2006"]) await expect(page.locator("[data-year-multiselect]")).toContainText(year);

  await page.locator("[data-person-multiselect] > button").click();
  await expect(page.locator("[data-person-multiselect]")).toContainText("Todas as pessoas");
});

test("mudança de pathname aplica ScrollToTop global", async ({ page }) => {
  await openFixtureHome(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await page.locator("[data-public-header-menu]").click();
  await page.getByRole("button", { name: "Pós-Festa", exact: true }).click();
  await expect(page).toHaveURL(/\/pos-festa$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("menu autenticado cabe sem rolagem em 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installAuthenticatedFixtures(page, true);
  await loginWithFixtures(page);
  await page.locator("[data-public-header-logo]").click();
  await page.locator("[data-public-header-menu]").click();
  await expect(page.locator("[data-account-actions-variant='mobile']")).toContainText("Painel Admin");
  const metrics = await page.locator("[data-public-mobile-menu]").evaluate(element => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }));
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
});
