import test from "node:test";
import assert from "node:assert/strict";
import { normalizeText, slugifyFaqText } from "../../src/lib/faqText.ts";
import { filterPublicFaqItems, groupPublicFaqItems } from "../../src/lib/faqPresentation.ts";
import { filterAdminFaqItems } from "../../src/app/admin/faq/faqAdmin.utils.ts";

const timestamp = "2026-07-16T00:00:00.000Z";

function category(overrides = {}) {
  return {
    id: "category-general",
    event_id: "event",
    key: "general",
    label: "Informações gerais",
    description: null,
    sort_order: 10,
    is_visible: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
    ...overrides,
  };
}

function item(overrides = {}) {
  return {
    id: "item-featured",
    event_id: "event",
    category_id: "category-general",
    slug: "qual-e-o-preco",
    question: "Qual é o preço?",
    answer: "Consulte o lote disponível.",
    sort_order: 10,
    is_visible: true,
    is_featured: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
    ...overrides,
  };
}

const defaultOptions = { search: "", categoryId: null, showAll: false, initialMode: "featured" };

test("normaliza maiúsculas e acentos e gera slug estável", () => {
  assert.equal(normalizeText("  CÔNJUGE e Reembolso  "), "conjuge e reembolso");
  assert.equal(slugifyFaqText("Cônjuge e Reembolso"), "conjuge-e-reembolso");
});

test("mostra somente destaques no modo inicial e Ver todas libera regulares", () => {
  const categories = [category()];
  const regular = item({ id: "item-regular", is_featured: false, sort_order: 20 });
  assert.deepEqual(filterPublicFaqItems([item(), regular], categories, defaultOptions).map(value => value.id), ["item-featured"]);
  assert.deepEqual(filterPublicFaqItems([item(), regular], categories, { ...defaultOptions, showAll: true }).map(value => value.id), ["item-featured", "item-regular"]);
});

test("busca em pergunta, resposta e categoria ignorando acentos", () => {
  const categories = [category({ label: "Lotes e preços" })];
  const values = [item({ answer: "Reembolso disponível conforme as regras." })];
  for (const search of ["PRECO", "reembôlso", "qual e o"] ) {
    assert.equal(filterPublicFaqItems(values, categories, { ...defaultOptions, search }).length, 1);
  }
});

test("busca consulta todas as perguntas mesmo antes de Ver todas", () => {
  const regular = item({ id: "regular", is_featured: false, answer: "Aceitamos PIX." });
  assert.deepEqual(filterPublicFaqItems([regular], [category()], { ...defaultOptions, search: "pix" }).map(value => value.id), ["regular"]);
});

test("oculta item invisível, apagado e item de categoria oculta ou apagada", () => {
  const visibleCategory = category();
  const hiddenCategory = category({ id: "hidden-category", is_visible: false });
  const deletedCategory = category({ id: "deleted-category", deleted_at: timestamp });
  const values = [
    item(),
    item({ id: "hidden-item", is_visible: false }),
    item({ id: "deleted-item", deleted_at: timestamp }),
    item({ id: "hidden-category-item", category_id: hiddenCategory.id }),
    item({ id: "deleted-category-item", category_id: deletedCategory.id }),
  ];
  assert.deepEqual(filterPublicFaqItems(values, [visibleCategory, hiddenCategory, deletedCategory], { ...defaultOptions, showAll: true }).map(value => value.id), ["item-featured"]);
});

test("filtra pela categoria selecionada", () => {
  const second = category({ id: "second", key: "payments", label: "Pagamentos", sort_order: 20 });
  const values = [item(), item({ id: "second-item", category_id: second.id })];
  assert.deepEqual(filterPublicFaqItems(values, [category(), second], { ...defaultOptions, showAll: true, categoryId: second.id }).map(value => value.id), ["second-item"]);
});

test("agrupa e ordena categorias e perguntas pela ordem da página", () => {
  const first = category({ id: "first", sort_order: 10 });
  const second = category({ id: "second", sort_order: 20 });
  const groups = groupPublicFaqItems([
    item({ id: "second-b", category_id: second.id, sort_order: 20 }),
    item({ id: "first", category_id: first.id, sort_order: 10 }),
    item({ id: "second-a", category_id: second.id, sort_order: 10 }),
  ], [second, first]);
  assert.deepEqual(groups.map(group => group.category.id), ["first", "second"]);
  assert.deepEqual(groups[1].items.map(value => value.id), ["second-a", "second-b"]);
});

test("Admin busca por slug/categoria e combina filtros de visibilidade e destaque", () => {
  const categories = [category({ label: "Checkout e pagamento" })];
  const values = [
    item({ id: "visible-featured", slug: "pagamento-pix" }),
    item({ id: "hidden-regular", slug: "cartao-credito", is_visible: false, is_featured: false }),
  ];
  const base = { search: "", categoryId: "", visibility: "all", featured: "all", sort: "page-order" };
  assert.deepEqual(filterAdminFaqItems(values, categories, { ...base, search: "checkout" }).map(value => value.id), ["visible-featured", "hidden-regular"]);
  assert.deepEqual(filterAdminFaqItems(values, categories, { ...base, search: "cartao" }).map(value => value.id), ["hidden-regular"]);
  assert.deepEqual(filterAdminFaqItems(values, categories, { ...base, visibility: "hidden", featured: "regular" }).map(value => value.id), ["hidden-regular"]);
});
