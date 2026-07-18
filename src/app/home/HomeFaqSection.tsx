import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  KeyRound,
  LayoutGrid,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import type { DbFaqCategory, DbFaqItem } from "../../lib/database.types";
import { filterPublicFaqItems, groupPublicFaqItems } from "../../lib/faqPresentation";

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

type FaqCategoryWithIcon = DbFaqCategory & { icon_key?: string | null };

const categoryIcons: Record<string, LucideIcon> = {
  "user-key": KeyRound,
  "layout-grid": LayoutGrid,
  "shield-lock": ShieldCheck,
  "calendar-days": CalendarDays,
  ticket: Ticket,
  "credit-card": CreditCard,
  "refresh-cw": RefreshCw,
};

function CategoryIcon({ category, size = 30 }: { category: FaqCategoryWithIcon; size?: number }) {
  const Icon = categoryIcons[category.icon_key ?? ""] ?? LayoutGrid;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.7} />;
}

export function HomeFaqSection({
  categories,
  items,
  eyebrow,
  title,
  searchPlaceholder,
  emptyLabel,
}: HomeFaqSectionProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const visibleCategories = useMemo(
    () => categories
      .filter(category => category.is_visible && category.deleted_at === null)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "pt-BR")),
    [categories],
  );

  const categoryIdsWithItems = useMemo(
    () => new Set(items.filter(item => item.is_visible && item.deleted_at === null).map(item => item.category_id)),
    [items],
  );

  useEffect(() => {
    const currentIsValid = categoryId
      && visibleCategories.some(category => category.id === categoryId && categoryIdsWithItems.has(category.id));
    if (currentIsValid) return;

    const firstWithItems = visibleCategories.find(category => categoryIdsWithItems.has(category.id));
    setCategoryId(firstWithItems?.id ?? visibleCategories[0]?.id ?? null);
  }, [categoryId, categoryIdsWithItems, visibleCategories]);

  const isSearching = Boolean(search.trim());

  const filteredItems = useMemo(() => filterPublicFaqItems(items, visibleCategories, {
    search,
    categoryId: isSearching ? null : categoryId,
    showAll: true,
    initialMode: "all",
  }), [categoryId, isSearching, items, search, visibleCategories]);

  const groups = useMemo(
    () => groupPublicFaqItems(filteredItems, visibleCategories),
    [filteredItems, visibleCategories],
  );

  const selectedCategory = visibleCategories.find(category => category.id === categoryId) ?? null;

  function selectCategory(id: string) {
    setCategoryId(id);
    setSearch("");
    setOpenIds(new Set());
  }

  function toggleItem(id: string) {
    setOpenIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="home-section home-faq-section" data-home-faq>
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">{eyebrow}</p>
        <h2 className="mb-8 font-['Playfair_Display'] text-4xl font-bold text-[#f0ebe0] md:text-5xl">{title}</h2>

        <label className="relative mb-7 block">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search aria-hidden="true" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
          <input
            type="search"
            aria-label={searchPlaceholder || title}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border border-[#2d6a4f]/35 bg-[#141f14] py-4 pl-12 pr-4 text-[#f0ebe0] outline-none transition placeholder:text-[#7a9a7a] focus-visible:border-[#c9a84c] focus-visible:ring-2 focus-visible:ring-[#c9a84c]/35"
          />
        </label>

        <nav className="mb-6 grid grid-cols-2 gap-2 lg:hidden" aria-label="Filtrar dúvidas por categoria">
          {visibleCategories.map(category => {
            const active = !isSearching && categoryId === category.id;
            const hasItems = categoryIdsWithItems.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                disabled={!hasItems}
                onClick={() => selectCategory(category.id)}
                className={`min-w-0 flex items-center gap-2 border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/35 bg-[#141f14] text-[#a8b9a8]"}`}
              >
                <span className="shrink-0"><CategoryIcon category={category as FaqCategoryWithIcon} size={18} /></span>
                <span className="min-w-0 text-[10px] font-mono font-bold uppercase leading-snug tracking-wide break-words">{category.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <nav className="hidden grid-cols-2 gap-3 lg:grid" aria-label="Filtrar dúvidas por categoria">
            {visibleCategories.map(category => {
              const active = !isSearching && categoryId === category.id;
              const hasItems = categoryIdsWithItems.has(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  disabled={!hasItems}
                  onClick={() => selectCategory(category.id)}
                  className={`flex aspect-square min-h-[112px] flex-col items-center justify-center gap-3 border p-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/35 bg-[#141f14] text-[#a8b9a8] hover:border-[#c9a84c]/70 hover:text-[#f0ebe0]"}`}
                >
                  <CategoryIcon category={category as FaqCategoryWithIcon} />
                  <span className="text-[10px] font-mono font-bold uppercase leading-snug tracking-wide">{category.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0">
            {!isSearching && selectedCategory && (
              <div className="mb-4">
                <div className="flex items-center gap-3 text-[#c9a84c] lg:hidden">
                  <CategoryIcon category={selectedCategory as FaqCategoryWithIcon} size={24} />
                  <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">{selectedCategory.label}</h3>
                </div>
                {selectedCategory.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[#7a9a7a]">{selectedCategory.description}</p>
                )}
              </div>
            )}

            {isSearching && (
              <p className="mb-4 text-sm text-[#a8b9a8]" role="status">
                Resultados para <strong className="text-[#f0ebe0]">“{search.trim()}”</strong>
              </p>
            )}

            {groups.length === 0 ? (
              <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-8 text-center" role="status">
                <p className="text-sm text-[#a8b9a8]">{emptyLabel}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map(group => (
                  <div key={group.category.id}>
                    {(isSearching || groups.length > 1) && group.category.label && (
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-[#c9a84c]"><CategoryIcon category={group.category as FaqCategoryWithIcon} size={22} /></span>
                        <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#f0ebe0]">{group.category.label}</h3>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {group.items.map(item => {
                        const isOpen = openIds.has(item.id);
                        const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
                        const panelId = `faq-answer-${safeId}`;
                        const buttonId = `faq-question-${safeId}`;
                        return (
                          <div key={item.id} className="border border-[#2d6a4f]/25 bg-[#141f14]">
                            <button
                              type="button"
                              id={buttonId}
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              onClick={() => toggleItem(item.id)}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none transition hover:bg-[#182718] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a84c] md:px-6 md:py-5"
                            >
                              <span className="text-sm font-semibold text-[#f0ebe0]">{item.question}</span>
                              <ChevronDown aria-hidden="true" size={17} className={`shrink-0 text-[#c9a84c] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <div id={panelId} aria-labelledby={buttonId} className="border-t border-[#2d6a4f]/20 px-5 pb-5 md:px-6" role="region">
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
          </div>
        </div>
      </div>
    </section>
  );
}
