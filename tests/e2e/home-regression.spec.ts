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

test("Home mantém apenas a timeline e a caixa de memórias da seção Sobre", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    const sections = JSON.parse(String(row.home_sections_json || "[]"));
    row.home_sections_json = JSON.stringify(sections.map((section: { key: string }) =>
      section.key === "timeline" ? { ...section, is_visible: true } : section));
  }});

  await loadHome(page);

  await expect(page.locator("[data-home-nostalgia-timeline]")).toHaveCount(1);
  await expect(page.locator("[data-home-memory-carousel]")).toHaveCount(1);
  await expect(page.getByText("Inicio do ensino medio", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Memórias da turma" })).toHaveCount(0);
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
  await expect(image).not.toHaveClass(/border/);

  const descriptionBox = await item.getByText("A fila para avisar que a aula tinha terminado.").boundingBox();
  const imageBox = await image.boundingBox();
  expect(descriptionBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(imageBox!.x).toBeGreaterThan(descriptionBox!.x);
});

test("conte\u00fado legado sobre o cancelamento e FAQ n\u00e3o s\u00e3o exibidos na Home", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.about_eyebrow = "INFORMA\u00c7\u00d5ES";
    row.about_title = "Sobre o site e o cancelamento";
    row.faq_title = "FAQ exibido na Home";
  }});

  await loadHome(page);
  await expect(page.getByText("Sobre o site e o cancelamento", { exact: true })).toHaveCount(0);
  await expect(page.getByText("FAQ exibido na Home", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-home-section='about']")).toBeVisible();
});

test("rodapé envia Criar meu perfil para a reivindicação de perfil", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const claimLink = page.locator('[data-footer-claim-profile="true"]');
  await expect(claimLink).toBeVisible();
  await expect(claimLink).toHaveAttribute("href", "/reivindicar-perfil");
  await claimLink.click();
  await expect(page).toHaveURL(/\/reivindicar-perfil$/);
});

test("Hero simplifica perfil, memórias removem divisor e rodapé esconde telefone", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.hero_event_line = "Colégio Henrique Castriciano · Natal/RN · Turma 2006";
    row.secondary_cta_label = "Criar ou atualizar meu perfil";
    row.footer_phone = "(51) 98992-6830";
  }});
  await loadHome(page);

  await expect(page.getByText("Colégio Henrique Castriciano · Natal/RN · Turma 2006", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-home-profile-cta="true"]')).toHaveText("Criar ou atualizar perfil");
  await expect(page.getByText("(51) 98992-6830", { exact: true })).toHaveCount(0);

  const avatarColumn = page.locator('[data-home-memory-avatar-column="true"]');
  await expect(avatarColumn).toBeVisible();
  await expect(avatarColumn).toHaveCSS("border-left-width", "0px");
});

test("Hero mostra Atualizar perfil para usuário autenticado", async ({ page }) => {
  await installHomeFixtures(page, { authenticated: true });
  await loadHome(page);
  await expect(page.locator('[data-home-profile-cta="true"]')).toHaveText("Atualizar perfil");
});

test("Home remove CTA de reembolso e mostra os bot\u00f5es de mem\u00f3ria e enquete", async ({ page }) => {
  await installHomeFixtures(page, { authenticated: true });
  await loadHome(page);

  await expect(page.getByRole("button", { name: /Entrar para acompanhar|Acompanhar reembolso/i })).toHaveCount(0);
  await expect(page.getByText("Comunicado sobre o encontro de 2026")).toBeVisible();
  await expect(page.locator("[data-add-memory]")).toContainText("Adicionar Mem\u00f3rias");
  await expect(page.locator("[data-create-poll]")).toContainText("Criar Enquetes");
  await page.locator("[data-create-poll]").click();
  await expect(page.locator("[data-home-poll-form]")).toBeVisible();
  await page.getByPlaceholder("Escreva a pergunta").fill("Qual atividade rever a seguir?");
  await page.getByPlaceholder("Uma opção por linha").fill("Café da manhã\nVisita à escola");
  const pollRequestPromise = page.waitForRequest(request => new URL(request.url()).pathname.endsWith("/rpc/submit_poll"));
  await page.getByRole("button", { name: "Publicar enquete" }).click();
  const pollRequest = await pollRequestPromise;
  expect(JSON.parse(pollRequest.postData() ?? "{}")).toMatchObject({
    p_event_id: "00000000-0000-0000-0000-000000000001",
    p_question: "Qual atividade rever a seguir?",
    p_options: ["Café da manhã", "Visita à escola"],
  });
  await expect(page.getByRole("status")).toContainText("Enquete criada e publicada.");
});

test("ações da Home compartilham o mesmo visual e a seção Fotos oferece envio", async ({ page }) => {
  await installHomeFixtures(page, { authenticated: true });
  await loadHome(page);

  const actions = [
    page.locator('[data-home-people-view-all="true"]'),
    page.locator('[data-add-memory]'),
    page.locator('[data-create-poll]'),
    page.locator('[data-home-photos-view-all="true"]'),
    page.locator('[data-home-photos-upload="true"]'),
  ];
  for (const action of actions) {
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute("data-home-action-button", "true");
  }

  const photos = page.locator('[data-home-section="photos"]');
  await expect(photos).toBeVisible();
  await expect(photos).toHaveCSS("background-color", "rgb(13, 26, 15)");

  const peopleViewAll = page.locator('[data-home-people-view-all="true"]');
  const initialBackground = await peopleViewAll.evaluate(element => getComputedStyle(element).backgroundColor);
  await peopleViewAll.hover();
  await expect(peopleViewAll).not.toHaveCSS("background-color", initialBackground);

  await expect(page.locator('[data-add-memory]')).toContainText("Adicionar Memórias");
  await expect(page.locator('[data-create-poll]')).toContainText("Criar Enquetes");
  await expect(page.locator('[data-home-photos-upload="true"]')).toContainText("Envie suas fotos");
});

test("os cards de turma filtram as pessoas cadastradas sem sair da Home", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  await page.locator('[data-home-about-stats] button[data-class-group="B"]').click();
  await expect(page.locator('[data-home-about-stats] button[data-class-group="B"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-home-registered-person]")).toHaveCount(2);
  await expect(page.locator("[data-home-registered-person]")).toContainText(["Turma B", "Turma B"]);
  await expect(page).toHaveURL(/\/$/);
});

test("bot\u00e3o Criar Enquete continua dispon\u00edvel sem enquete aberta", async ({ page }) => {
  await installHomeFixtures(page, { polls: [], authenticated: true });
  await loadHome(page);

  await expect(page.locator("[data-home-poll]")).toContainText("Nenhuma enquete aberta.");
  await expect(page.locator("[data-create-poll]")).toBeVisible();
  await page.locator("[data-create-poll]").click();
  await expect(page.locator("[data-home-poll-form]")).toBeVisible();
});

test("Adicionar mem\u00f3ria reaproveita a p\u00e1gina de envio existente", async ({ page }) => {
  await installHomeFixtures(page, { authenticated: true });
  await loadHome(page);

  await page.locator("[data-add-memory]").click();
  await expect(page).toHaveURL(/\/nossa-historia\/memorias$/);
  await expect(page.getByText("Enviar mem\u00f3ria", { exact: true })).toBeVisible();
});

test("Home inicia com até 24 pessoas, prioriza perfis cadastrados e abre o modal sobre a Home", async ({ page }) => {
  await installHomeFixtures(page, { people: peopleFixture.map((person, index) => ({
    ...person,
    avatar_url: index === 7 ? "https://example.test/privado.jpg" : null,
    contact_email: "privado-" + (index + 1) + "@example.test",
    contact_phone: "+551199999000" + index,
    private_notes: "nota privada " + (index + 1),
  })) });
  await loadHome(page);

  const box = page.locator("[data-home-registered-people]");
  await expect(box.locator("[data-home-registered-person]")).toHaveCount(8);
  await expect(box).toContainText("Perfil cadastrado 1");
  await expect(box.locator("[data-home-registered-person]").first()).toContainText("Perfil cadastrado 1");
  await expect(box.locator("[data-home-registered-person]").first()).toContainText("Turma A");
  await expect(box.locator("img").first()).toHaveAttribute("src", "https://example.test/public-avatar.jpg");
  await expect(box).toContainText("Pessoa Confirmada 7");
  await expect(box.locator("[data-home-registered-person]").filter({ hasText: "Pessoa Confirmada 8" }).locator("img")).toHaveCount(0);
  await expect(box).not.toContainText("privado-");
  await expect(box).not.toContainText("+5511");
  await expect(box).not.toContainText("nota privada");

  const currentUrl = page.url();
  await box.locator("[data-home-registered-person]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Perfil cadastrado 1");
  await expect(page.getByRole("dialog").locator("h3")).toHaveClass(/text-\[\#c9a84c\]/);
  await expect(page.getByRole("dialog").locator("[data-profile-info]").first().locator("p").last()).toHaveCSS("color", "rgb(212, 232, 214)");
  expect(page.url()).toBe(currentUrl);
});

test("Home limita a grade inicial a 24 pessoas de todas as turmas", async ({ page }) => {
  const people = Array.from({ length: 32 }, (_, index) => ({
    ...peopleFixture[index % peopleFixture.length],
    id: `00000000-0000-0000-0002-${String(index + 1).padStart(12, "0")}`,
    full_name: `Pessoa ${String(index + 1).padStart(2, "0")}`,
    display_name: null,
    profile_status: "unclaimed" as const,
    class_group: ["A", "B", "C", "D"][index % 4],
  }));
  await installHomeFixtures(page, { people });
  await loadHome(page);

  const box = page.locator("[data-home-registered-people]");
  await expect(box.locator("[data-home-registered-person]")).toHaveCount(24);
  await expect(box).toContainText("Pessoa 24");
  await expect(box).not.toContainText("Pessoa 25");
  await expect(box).toContainText("Turma A");
  await expect(box).toContainText("Turma B");
  await expect(box).toContainText("Turma C");
  await expect(box).toContainText("Turma D");
});

test("filtros de perfil do diretório usam três colunas e rótulo Sem Perfil no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installHomeFixtures(page);
  await page.goto("/ex-alunos");
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible({ timeout: 20_000 });

  const row = page.locator('[data-mobile-attendance-filter-row="true"]');
  await expect(row).toBeVisible({ timeout: 20_000 });
  const buttons = row.locator('[data-mobile-attendance-filter="true"]');
  await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(0)).toContainText("Todos");
  await expect(buttons.nth(1)).toContainText("Cadastrados");
  await expect(buttons.nth(2)).toContainText("Sem perfil");
  await expect(buttons.nth(2)).not.toContainText("Ainda sem perfil");

  const columns = await row.evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length
  );
  expect(columns).toBe(3);

  const boxes = await Promise.all(Array.from({ length: 3 }, (_, index) => buttons.nth(index).boundingBox()));
  boxes.forEach(box => expect(box).not.toBeNull());
  expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x + 1);
  expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(boxes[2]!.x + 1);
});

test("ações do diretório ficam alinhadas na mesma linha em viewport móvel", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const unclaimedPeople = peopleFixture.map(person => ({ ...person, profile_status: "unclaimed" as const }));
  await installHomeFixtures(page, { people: unclaimedPeople });
  await page.goto("/ex-alunos");
  await expect(page.getByRole("heading", { name: "Ex-alunos" })).toBeVisible({ timeout: 20_000 });

  const invite = page.getByRole("button", { name: "Enviar Convite", exact: true }).first();
  const claim = page.getByRole("button", { name: "Sou eu!", exact: true }).first();
  await expect(invite).toBeVisible();
  await expect(claim).toBeVisible();
  const [inviteBox, claimBox] = await Promise.all([invite.boundingBox(), claim.boundingBox()]);
  expect(inviteBox).not.toBeNull();
  expect(claimBox).not.toBeNull();
  expect(Math.abs(inviteBox!.y - claimBox!.y)).toBeLessThanOrEqual(1);
  const noOverlap = inviteBox!.x + inviteBox!.width <= claimBox!.x + 1 || claimBox!.x + claimBox!.width <= inviteBox!.x + 1;
  expect(noOverlap).toBe(true);
  await expect(invite).toHaveCSS("font-size", "7px");
  await expect(invite).toHaveCSS("background-color", "rgb(201, 168, 76)");
  await expect(invite).toHaveCSS("color", "rgb(13, 26, 15)");
  await expect(claim).not.toHaveCSS("background-color", "rgb(201, 168, 76)");
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
  await expect(about.locator("[data-home-about-stats]")).toContainText("TOTAL DE ALUNOS CONCLUINTES");
  for (const group of ["A", "B", "C", "D"]) {
    const classCard = about.locator(`[data-class-group='${group}']`);
    await expect(classCard).toContainText("2");
    await expect(classCard).toHaveClass(/bg-\[#091109\]/);
    await expect(classCard).not.toHaveClass(/border/);
  }
  await expect(about.locator("[data-home-profile-metrics]")).toContainText("50%");
  const map = about.locator("[data-home-map-chart]");
  await map.getByRole("button", { name: "Natal", exact: true }).click();
  await expect(map).toContainText("Natal/RN");
  await expect(map).toContainText("40%");
  await expect(about.getByText("Graficos", { exact: true })).toHaveCount(0);
});

test("mapa da turma navega de Mundo até Natal e revela as pessoas da região", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const map = page.locator("[data-home-map-chart]");
  await expect(map).toHaveAttribute("data-map-level", "world");
  await expect(map).toContainText("Exterior");
  await expect(map).toContainText("Lisboa · Portugal");
  const worldMapButton = map.getByRole("button", { name: "Explorar Brasil" });
  const worldMapImages = worldMapButton.locator("img");
  await expect(worldMapImages.nth(0)).toHaveCSS("opacity", "1");
  await worldMapButton.hover();
  await expect(worldMapImages.nth(0)).toHaveCSS("opacity", "0");
  await expect(worldMapImages.nth(1)).toHaveCSS("opacity", "1");

  await worldMapButton.click();
  await expect(map).toHaveAttribute("data-map-level", "brazil");
  await expect(map).toContainText("Outros estados");
  await expect(map).toContainText("Recife/PE");

  await map.getByRole("button", { name: "Explorar Rio Grande do Norte" }).click();
  await expect(map).toHaveAttribute("data-map-level", "rn");
  await expect(map).toContainText("Interior do RN");
  await expect(map).toContainText("Mossoró/RN");

  await map.getByRole("button", { name: "Explorar Natal" }).click();
  await expect(map).toHaveAttribute("data-map-level", "natal");
  await expect(map).toContainText("Natal/RN");
  await expect(map).toContainText("Natal 1");
  await expect(map).toContainText("Natal 2");

  await map.getByRole("button", { name: "Mundo", exact: true }).click();
  await expect(map).toHaveAttribute("data-map-level", "world");
});

test("mapa da turma preserva estado vazio quando não há localizações públicas", async ({ page }) => {
  await installHomeFixtures(page, { locations: [] });
  await loadHome(page);

  const map = page.locator("[data-home-map-chart]");
  await expect(map).toContainText("Ainda não há pessoas com localização pública nesta região.");
  await expect(map).toContainText("0%");
});

test("carrossel de memorias avanca, volta e preserva anonimato", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const carousel = page.locator("[data-home-memory-carousel]");
  await expect(carousel).toContainText("A primeira memória da turma.");
  await expect(carousel.locator("[data-memory-author]")).toHaveText("Perfil 1");
  await expect(carousel.locator("[data-memory-class]")).toHaveText("Turma A");
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

test("timeline mantem todos os marcos sempre abertos", async ({ page }) => {
  await installHomeFixtures(page);
  await loadHome(page);

  const timeline = page.locator("[data-home-nostalgia-timeline]");
  const items = timeline.locator("[data-timeline-index]");
  await expect(items.nth(0)).toContainText("1996");
  await expect(items.nth(1)).toContainText("2006");
  await expect(timeline.locator("[data-timeline-active='true']")).toHaveCount(2);
  await expect(items.nth(0)).toContainText("Um marco da turma.");
  await expect(items.nth(1)).toContainText("O fim de um ciclo.");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(timeline.locator("[data-timeline-active='true']")).toHaveCount(2);
});

test("timeline ordena os marcos cronologicamente mesmo quando o CMS salva fora de ordem", async ({ page }) => {
  await installHomeFixtures(page, { mutateHome: row => {
    row.home_nostalgia_timeline_json = JSON.stringify([
      { year: "2006", title: "Formatura" },
      { year: "1995", title: "Primeiro marco" },
      { year: "1999", title: "Marco intermediário" },
    ]);
  }});
  await loadHome(page);

  const items = page.locator("[data-home-nostalgia-timeline] [data-timeline-index]");
  await expect(items.nth(0)).toContainText("1995");
  await expect(items.nth(1)).toContainText("1999");
  await expect(items.nth(2)).toContainText("2006");
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
  await expect(page.getByText("O que você quer viver no reencontro?", { exact: true })).toHaveCount(0);
});
