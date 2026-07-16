import type { DbFaqCategory, DbFaqItem } from "../../../lib/database.types";
import type { FaqFeaturedFilter, FaqSort, FaqVisibilityFilter } from "../../../lib/faq";
import { normalizeText } from "../../../lib/faqText.ts";

export interface AdminFaqListFilters {
  search: string;
  categoryId: string;
  visibility: FaqVisibilityFilter;
  featured: FaqFeaturedFilter;
  sort: FaqSort;
}

export function filterAdminFaqItems(items: DbFaqItem[], categories: DbFaqCategory[], filters: AdminFaqListFilters): DbFaqItem[] {
  const categoryById = new Map(categories.map(category => [category.id, category]));
  const term = normalizeText(filters.search);
  const result = items.filter(item => {
    if (filters.categoryId && item.category_id !== filters.categoryId) return false;
    if (filters.visibility === "visible" && !item.is_visible) return false;
    if (filters.visibility === "hidden" && item.is_visible) return false;
    if (filters.featured === "featured" && !item.is_featured) return false;
    if (filters.featured === "regular" && item.is_featured) return false;
    if (!term) return true;
    return normalizeText([item.question, item.answer, item.slug, categoryById.get(item.category_id)?.label ?? ""].join(" ")).includes(term);
  });
  if (filters.sort === "newest") return result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (filters.sort === "alphabetical") return result.sort((a, b) => a.question.localeCompare(b.question, "pt-BR"));
  return result.sort((a, b) => (categoryById.get(a.category_id)?.sort_order ?? 0) - (categoryById.get(b.category_id)?.sort_order ?? 0) || a.sort_order - b.sort_order);
}
