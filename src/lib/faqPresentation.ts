import type { DbFaqCategory, DbFaqItem } from "./database.types";
import { normalizeText } from "./faqText.ts";

export interface FaqGroup {
  category: DbFaqCategory;
  items: DbFaqItem[];
}

function isPublicCategory(category: DbFaqCategory): boolean {
  return category.is_visible && category.deleted_at === null;
}

function isPublicItem(item: DbFaqItem, categoryById: Map<string, DbFaqCategory>): boolean {
  const category = categoryById.get(item.category_id) ?? item.category ?? null;
  return item.is_visible
    && item.deleted_at === null
    && (item.id.startsWith("legacy-") || Boolean(category && isPublicCategory(category)));
}

export function filterPublicFaqItems(
  items: DbFaqItem[],
  categories: DbFaqCategory[],
  options: { search: string; categoryId: string | null; showAll: boolean; initialMode: "featured" | "all" },
): DbFaqItem[] {
  const categoryById = new Map(categories.filter(isPublicCategory).map(category => [category.id, category]));
  const search = normalizeText(options.search);

  return items.filter(item => {
    if (!isPublicItem(item, categoryById)) return false;
    if (options.categoryId && item.category_id !== options.categoryId) return false;
    if (!search && !options.showAll && options.initialMode === "featured" && !item.is_featured) return false;
    if (!search) return true;
    const category = categoryById.get(item.category_id) ?? item.category;
    return normalizeText([item.question, item.answer, category?.label ?? ""].join(" ")).includes(search);
  });
}

export function groupPublicFaqItems(items: DbFaqItem[], categories: DbFaqCategory[]): FaqGroup[] {
  const visibleCategories = categories
    .filter(isPublicCategory)
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "pt-BR"));

  const groups = visibleCategories.flatMap(category => {
    const categoryItems = items
      .filter(item => item.category_id === category.id)
      .sort((a, b) => a.sort_order - b.sort_order || a.question.localeCompare(b.question, "pt-BR"));
    return categoryItems.length ? [{ category, items: categoryItems }] : [];
  });

  const knownCategoryIds = new Set(visibleCategories.map(category => category.id));
  const legacyItems = items
    .filter(item => item.id.startsWith("legacy-") && !knownCategoryIds.has(item.category_id))
    .sort((a, b) => a.sort_order - b.sort_order);
  if (!legacyItems.length) return groups;

  const legacyCategory: DbFaqCategory = {
    id: "legacy-general",
    event_id: legacyItems[0].event_id,
    key: "legacy-general",
    label: "",
    description: null,
    sort_order: Number.MAX_SAFE_INTEGER,
    is_visible: true,
    created_at: legacyItems[0].created_at,
    updated_at: legacyItems[0].updated_at,
    created_by_admin_id: null,
    updated_by_admin_id: null,
    deleted_at: null,
    deleted_by_admin_id: null,
  };
  return [...groups, { category: legacyCategory, items: legacyItems }];
}
