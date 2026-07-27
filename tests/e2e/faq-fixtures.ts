import type { Page, Route } from "@playwright/test";
import { installHomeFixtures } from "./home-fixtures";

export const FAQ_EVENT_ID = "00000000-0000-0000-0000-000000000001";

const timestamp = "2026-07-27T12:00:00.000Z";

export const faqCategories = [
  {
    id: "00000000-0000-4000-8000-000000001001",
    event_id: FAQ_EVENT_ID,
    key: "general",
    label: "Informações gerais",
    description: "Dados essenciais sobre o reencontro.",
    icon_key: "calendar-days",
    sort_order: 10,
    is_visible: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
  },
  {
    id: "00000000-0000-4000-8000-000000001002",
    event_id: FAQ_EVENT_ID,
    key: "payments",
    label: "Pagamentos",
    description: "Compra, cancelamento e reembolso.",
    icon_key: "credit-card",
    sort_order: 20,
    is_visible: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
  },
  {
    id: "00000000-0000-4000-8000-000000001003",
    event_id: FAQ_EVENT_ID,
    key: "privacy",
    label: "Dados e privacidade",
    description: "Categoria administrativa que não deve aparecer na Home.",
    icon_key: "shield-lock",
    sort_order: 30,
    is_visible: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
  },
];

function faqItem(
  id: string,
  category: (typeof faqCategories)[number],
  question: string,
  answer: string,
  sortOrder: number,
) {
  return {
    id,
    event_id: FAQ_EVENT_ID,
    category_id: category.id,
    slug: question
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    question,
    answer,
    sort_order: sortOrder,
    is_visible: true,
    is_featured: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
    category,
  };
}

export const faqItems = [
  faqItem(
    "00000000-0000-4000-8000-000000002001",
    faqCategories[0],
    "Quando será o reencontro?",
    "O reencontro será realizado em outubro de 2026.",
    10,
  ),
  faqItem(
    "00000000-0000-4000-8000-000000002002",
    faqCategories[1],
    "Como funciona o reembolso?",
    "O reembolso segue a política publicada para o lote adquirido.",
    10,
  ),
  faqItem(
    "00000000-0000-4000-8000-000000002003",
    faqCategories[2],
    "Quais dados são publicados?",
    "Somente dados autorizados pelo titular.",
    10,
  ),
];

async function fulfillJson(route: Route, payload: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

function configureFaqCopy(row: Record<string, unknown>) {
  row.faq_eyebrow = "FAQ";
  row.faq_title = "Perguntas frequentes";
  row.faq_search_placeholder = "Buscar no FAQ";
  row.faq_empty_label = "Nenhuma dúvida encontrada.";
  row.faq_view_all_label = "Ver todas";
  row.faq_initial_mode = "all";
}

async function installFaqRoute(
  page: Page,
  options: { structured: boolean },
) {
  await page.route("**/rest/v1/**", async route => {
    const url = new URL(route.request().url());
    const restPath = url.pathname.split("/rest/v1/")[1] ?? "";

    if (restPath === "rpc/has_structured_faq_items") {
      await fulfillJson(route, options.structured);
      return;
    }

    const resource = restPath.split("?")[0].split("/")[0];
    if (resource === "faq_categories") {
      await fulfillJson(route, options.structured ? faqCategories : []);
      return;
    }
    if (resource === "faq_items") {
      await fulfillJson(route, options.structured ? faqItems : []);
      return;
    }

    await route.fallback();
  });
}

export async function installStructuredFaqFixtures(page: Page) {
  await installHomeFixtures(page, { mutateHome: configureFaqCopy });
  await installFaqRoute(page, { structured: true });
}

export async function installLegacyFaqFixtures(page: Page) {
  await installHomeFixtures(page, { mutateHome: configureFaqCopy });
  await installFaqRoute(page, { structured: false });
}
