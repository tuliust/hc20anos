import { expect, test, type Page } from "@playwright/test";
import { installHomeFixtures, peopleFixture } from "./home-fixtures";

async function loadHome(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-home-loaded]")).toBeVisible({ timeout: 20_000 });
}

test("não renderiza a Home antes do CMS e renderiza após a resposta", async ({ page }) => {
  await installHomeFixtures(page, { delayHomeMs: 3000 });

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

test("imagem da timeline aparece à direita somente no marco expandido", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.home_nostalgia_timeline_json = JSON.stringify([{
      year: "1995",
      title: "Orelhão pra ligar pra casa",
      description: "A fila para avisar que a aula tinha terminado.",
      image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240'%3E%3Crect width='320' height='240' fill='%2300a4e4'/%3E%3C/svg%3E",
    }]);
  }});

  await loadHome(page);
  const item = page.locator("[data-timeline-index='0']");
  const button = item.getByRole("button");
  const image = item.getByRole("img", { name: "Orelhão pra ligar pra casa" });
  if (await button.getAttribute("aria-expanded") === "true") await button.evaluate(element => (element as HTMLButtonElement).click());
  await expect(image).not.toBeVisible();
  await button.evaluate(element => (element as HTMLButtonElement).click());
  await expect(image).toBeVisible();

  const descriptionBox = await item.getByText("A fila para avisar que a aula tinha terminado.").boundingBox();
  const imageBox = await image.boundingBox();
  expect(descriptionBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(imageBox!.x).toBeGreaterThan(descriptionBox!.x);
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
  await expect(grid).toHaveAttribute("data-avatar-size", "102");
  await expect(grid).toHaveClass(/grid-cols-2/);
});

test("Home remove Nossa Historia e CTA de ingresso do header", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  await expect(page.getByText("Nossa historia em imagens", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-public-header]").getByRole("button", { name: /Comprar ingresso/i })).toHaveCount(0);
});

test("distribuicao por sala centraliza tabs e mostra pessoas em tres colunas", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  await expect(page.locator("[data-home-class-tabs]")).toHaveClass(/justify-center/);
  await expect(page.locator("[data-home-class-people]")).toHaveClass(/grid-cols-3/);
  await expect(page.locator("[data-home-class-people] > div")).toHaveCount(2);
});

test("uma unica pessoa confirmada ocupa toda a altura disponivel", async ({ page }) => {
  await installHomeFixtures(page, {
    people: peopleFixture.map((person, index) => ({ ...person, profile_status: index === 0 ? "confirmed" : "claimed" })),
  });
  await loadHome(page);

  const grid = page.locator("[data-home-confirmed-grid]");
  await expect(grid).toHaveAttribute("data-count", "1");
  await expect(grid).toHaveAttribute("data-avatar-size", "144");
  await expect(grid.getByRole("img")).toHaveCSS("height", "144px");
});

test("Sobre exibe total, turmas normalizadas e cards de dados sem Graficos", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const about = page.locator("[data-home-section='about']");
  await expect(about.locator("[data-home-about-stats]")).toContainText("8");
  for (const group of ["A", "B", "C", "D"]) {
    await expect(about.locator(`[data-class-group='${group}']`)).toContainText("2");
  }
  await expect(about.locator("[data-home-profile-metrics]")).toContainText("50%");
  await expect(about.locator("[data-home-map-chart]")).toContainText("Natal/RN");
  await expect(about.locator("[data-home-map-chart]")).toContainText("2 · 40%");
  await expect(about.getByText("Graficos", { exact: true })).toHaveCount(0);
});

test("carrossel de memorias avanca, volta e preserva anonimato", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const carousel = page.locator("[data-home-memory-carousel]");
  await expect(carousel).toContainText("A primeira memória da turma.");
  await expect(carousel).toContainText("Pessoa 1 · Turma A");
  await carousel.getByRole("button", { name: "Próxima memória" }).click();
  await expect(carousel).toContainText("A segunda memória da turma.");
  await expect(carousel).toContainText("Anônimo");
  await carousel.getByRole("button", { name: "Memória anterior" }).click();
  await expect(carousel).toContainText("A primeira memória da turma.");
});

test("carrossel de memorias avanca automaticamente a cada tres segundos", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const carousel = page.locator("[data-home-memory-carousel]");
  await expect(carousel).toContainText("A primeira memória da turma.");
  await expect(carousel).toContainText("A segunda memória da turma.", { timeout: 4_000 });
});

test("timeline mostra ano completo e mantem somente um marco aberto", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const timeline = page.locator("[data-home-nostalgia-timeline]");
  const items = timeline.locator("[data-timeline-index]");
  await expect(items.nth(0)).toContainText("1996");
  await expect(items.nth(1)).toContainText("2006");
  await timeline.scrollIntoViewIfNeeded();
  await expect(timeline.locator("[data-timeline-active='true']")).toHaveCount(1);
  const activeIndex = await items.nth(0).getAttribute("data-timeline-active") === "true" ? 0 : 1;
  const nextIndex = activeIndex === 0 ? 1 : 0;
  await items.nth(nextIndex).getByRole("button").press("Enter");
  await expect(items.nth(activeIndex)).toHaveAttribute("data-timeline-active", "false");
  await expect(items.nth(nextIndex)).toHaveAttribute("data-timeline-active", "true");
});

test("enquete da Home pede login antes de votar e esconde resultado", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const poll = page.locator("[data-home-poll]");
  await expect(poll).toContainText("Qual lembrança marcou a turma?");
  await expect(poll).not.toContainText("75%");
  await poll.getByRole("button", { name: "A formatura" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("Pos-festa termina depois da mensagem da organizacao", async ({ page }) => {
  await installHomeFixtures(page);
  await page.goto("/pos-festa");

  await expect(page.getByText("Mensagem final da organizacao.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Um espaço para guardar fotos oficiais/i)).toHaveCount(0);
  await expect(page.getByText("Fotos oficiais e destaques", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Melhores momentos", { exact: true })).toHaveCount(0);
});

test("Curiosidades alinha introducao a esquerda e remove leitura por IA", async ({ page }) => {
  await installHomeFixtures(page);
  await page.goto("/curiosidades");

  const eyebrow = page.getByText("Curiosidades da turma", { exact: true });
  const subtitle = page.getByText(/Dados, lembranças, mapa, profissões/i);
  await expect(eyebrow).toBeVisible({ timeout: 20_000 });
  await expect(subtitle).toBeVisible({ timeout: 20_000 });
  await expect(subtitle).toHaveClass(/text-left/);
  const titleBox = await page.getByRole("heading", { name: "O raio-X da Turma 2006" }).boundingBox();
  const eyebrowBox = await eyebrow.boundingBox();
  const subtitleBox = await subtitle.boundingBox();
  expect(Math.abs((titleBox?.x ?? 0) - (eyebrowBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((titleBox?.x ?? 0) - (subtitleBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await expect(page.getByText("Leitura por IA", { exact: true })).toHaveCount(0);
  await expect(page.getByText("O retrato da turma até agora", { exact: true })).toHaveCount(0);
});
