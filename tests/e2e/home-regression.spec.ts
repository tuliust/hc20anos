import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

async function loadHome(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
}

test("não renderiza a Home antes do CMS e renderiza após a resposta", async ({ page }) => {
  await installHomeFixtures(page, { delayHomeMs: 700 });

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toHaveCount(0);
  await expect(page.getByText(/Carregando conteúdo/i)).toBeVisible();
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
});

test("monta visão geral, timeline CMS, tabs de turmas e CTA do evento", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);
  await expect(page.locator("[data-home-alumni-overview]")).toBeVisible();
  await expect(page.locator("[data-home-nostalgia-timeline]")).toBeVisible();
  await expect(page.locator("[data-home-class-tabs] button").first()).toBeVisible();

  await page.locator("[data-home-event-cta]").click();
  await expect(page).toHaveURL(/\/evento$/);
});

test("timeline usa exclusivamente os itens do CMS", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.home_nostalgia_timeline_json = JSON.stringify([
      { year: "2006", icon: "book-image", title: "Marco exclusivo do teste", description: "Conteúdo vindo do CMS." },
    ]);
  }});

  await loadHome(page);
  await expect(page.getByText("Marco exclusivo do teste")).toBeVisible();
  await expect(page.locator("[data-home-nostalgia-timeline] button")).toHaveCount(1);
});

test("seção Sobre obrigatória incompleta fica oculta sem fallback", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.about_title = "";
  }});

  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-home-section='about']")).toHaveCount(0);
});

test("seções ocultas no CMS não são montadas", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    const sections = JSON.parse(String(row.home_sections_json || "[]"));
    row.home_sections_json = JSON.stringify(sections.map((section: { key: string }) =>
      section.key === "info" ? { ...section, is_visible: false } : section));
  }});

  await loadHome(page);
  await expect(page.locator("[data-home-section='info']")).toHaveCount(0);
});

test("grade de confirmados usa limite CMS e layout proporcional", async ({ page }) => {
  await installHomeFixtures(page, {
    people: peopleFixture.map(person => ({ ...person, profile_status: "confirmed" })),
    mutateHome: row => { row.confirmed_preview_limit = "2"; },
  });

  await loadHome(page);
  const grid = page.locator("[data-home-confirmed-grid]");
  await expect(grid).toHaveAttribute("data-count", "2");
  await expect(grid).toHaveClass(/grid-cols-2/);
});
