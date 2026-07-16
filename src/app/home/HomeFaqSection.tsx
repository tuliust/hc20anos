import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { DbFaqCategory, DbFaqItem } from "../../lib/database.types";
import { normalizeText } from "../../lib/faq";

export interface HomeFaqSectionProps {
  categories: DbFaqCategory[];
  items: DbFaqItem[];
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  emptyLabel: string;
  viewAllLabel: string;
  initialMode: "featured" | "all";
}

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

export function HomeFaqSection({
  categories,
  items,
  eyebrow,
  title,
  searchPlaceholder,
  emptyLabel,
  viewAllLabel,
  initialMode,
}: HomeFaqSectionProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(initialMode === "all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => setShowAll(initialMode === "all"), [initialMode]);

  const visibleCategories = useMemo(
    () => categories.filter(isPublicCategory).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  useEffect(() => {
    if (categoryId && !visibleCategories.some(category => category.id === categoryId)) setCategoryId(null);
  }, [categoryId, visibleCategories]);

  const filteredItems = useMemo(() => filterPublicFaqItems(items, visibleCategories, {
    search,
    categoryId,
    showAll,
    initialMode,
  }), [categoryId, initialMode, items, search, showAll, visibleCategories]);

  const groups = useMemo(
    () => groupPublicFaqItems(filteredItems, visibleCategories),
    [filteredItems, visibleCategories],
  );

  function toggleItem(id: string) {
    setOpenIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="home-section bg-[#0d1a0f]" data-home-faq>
      <div className="max-w-4xl mx-auto px-4">
        <p className="font-mono text-[#c9a84c] text-xs uppercase tracking-[0.2em] mb-4">{eyebrow}</p>
        <h2 className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-4xl md:text-5xl mb-8">{title}</h2>

        <label className="relative block mb-5">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search aria-hidden="true" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
          <input
            type="search"
            aria-label={searchPlaceholder || title}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border border-[#2d6a4f]/35 bg-[#141f14] py-4 pl-12 pr-4 text-[#f0ebe0] placeholder:text-[#7a9a7a] outline-none transition focus-visible:border-[#c9a84c] focus-visible:ring-2 focus-visible:ring-[#c9a84c]/35"
          />
        </label>

        <nav className="-mx-4 mb-8 overflow-x-auto px-4 [scrollbar-width:thin]" aria-label="Filtrar dúvidas por categoria">
          <div className="flex min-w-max gap-2 pb-2">
            <button
              type="button"
              aria-pressed={categoryId === null}
              onClick={() => setCategoryId(null)}
              className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${categoryId === null ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/35 bg-[#141f14] text-[#a8b9a8] hover:border-[#2d6a4f]"}`}
            >
              Todas
            </button>
            {visibleCategories.map(category => (
              <button
                key={category.id}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${categoryId === category.id ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/35 bg-[#141f14] text-[#a8b9a8] hover:border-[#2d6a4f]"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </nav>

        {groups.length === 0 ? (
          <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-8 text-center" role="status">
            <p className="text-[#a8b9a8] text-sm">{emptyLabel}</p>
          </div>
        ) : (
          <div className="space-y-9">
            {groups.map(group => (
              <div key={group.category.id}>
                {group.category.label && <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#f0ebe0]">{group.category.label}</h3>
                  {group.category.description && <p className="hidden text-right text-xs text-[#7a9a7a] md:block">{group.category.description}</p>}
                </div>}
                <div className="flex flex-col gap-2">
                  {group.items.map(item => {
                    const isOpen = openIds.has(item.id);
                    const panelId = `faq-answer-${item.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                    const buttonId = `faq-question-${item.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                    return (
                      <div key={item.id} className="border border-[#2d6a4f]/25 bg-[#141f14]">
                        <button
                          type="button"
                          id={buttonId}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleItem(item.id)}
                          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left outline-none transition hover:bg-[#182718] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a84c]"
                        >
                          <span className="text-sm font-semibold text-[#f0ebe0]">{item.question}</span>
                          <ChevronDown aria-hidden="true" size={17} className={`shrink-0 text-[#c9a84c] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div id={panelId} aria-labelledby={buttonId} className="border-t border-[#2d6a4f]/20 px-6 pb-5" role="region">
                            <p className="whitespace-pre-line pt-4 text-sm leading-relaxed text-[#a8b9a8]">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!search.trim() && !showAll && initialMode === "featured" && items.some(item => !item.is_featured) && viewAllLabel && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="border border-[#c9a84c] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#c9a84c] transition hover:bg-[#c9a84c] hover:text-[#0d1a0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0ebe0]"
            >
              {viewAllLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
