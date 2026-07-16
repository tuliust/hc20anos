import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { DbFaqCategory, DbFaqItem } from "../../../lib/database.types";
import { normalizeText, type FaqFeaturedFilter, type FaqSort, type FaqVisibilityFilter } from "../../../lib/faq";

interface AdminFaqQuestionsProps {
  items: DbFaqItem[];
  categories: DbFaqCategory[];
  busyId: string;
  onCreate: () => void;
  onEdit: (item: DbFaqItem) => void;
  onVisibility: (item: DbFaqItem) => void;
  onFeatured: (item: DbFaqItem) => void;
  onMoveCategory: (item: DbFaqItem, categoryId: string) => void;
  onMoveOrder: (item: DbFaqItem, direction: -1 | 1) => void;
  onDelete: (item: DbFaqItem) => void;
}

const controlClass = "border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-xs text-[#f0ebe0] outline-none focus:border-[#c9a84c]";
const actionClass = "inline-flex items-center gap-1.5 border border-[#2d6a4f]/35 px-2.5 py-2 text-[10px] font-mono uppercase tracking-wider text-[#a8b9a8] transition hover:border-[#c9a84c] hover:text-[#f0ebe0] disabled:opacity-40";

export function AdminFaqQuestions({ items, categories, busyId, onCreate, onEdit, onVisibility, onFeatured, onMoveCategory, onMoveOrder, onDelete }: AdminFaqQuestionsProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState<FaqVisibilityFilter>("all");
  const [featured, setFeatured] = useState<FaqFeaturedFilter>("all");
  const [sort, setSort] = useState<FaqSort>("page-order");

  const categoryById = useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);
  const filtered = useMemo(() => {
    const term = normalizeText(search);
    const result = items.filter(item => {
      if (categoryId && item.category_id !== categoryId) return false;
      if (visibility === "visible" && !item.is_visible) return false;
      if (visibility === "hidden" && item.is_visible) return false;
      if (featured === "featured" && !item.is_featured) return false;
      if (featured === "regular" && item.is_featured) return false;
      if (!term) return true;
      return normalizeText([item.question, item.answer, item.slug, categoryById.get(item.category_id)?.label ?? ""].join(" ")).includes(term);
    });
    if (sort === "newest") return result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    if (sort === "alphabetical") return result.sort((a, b) => a.question.localeCompare(b.question, "pt-BR"));
    return result.sort((a, b) => (categoryById.get(a.category_id)?.sort_order ?? 0) - (categoryById.get(b.category_id)?.sort_order ?? 0) || a.sort_order - b.sort_order);
  }, [categoryById, categoryId, featured, items, search, sort, visibility]);

  const metrics = {
    total: items.length,
    visible: items.filter(item => item.is_visible).length,
    hidden: items.filter(item => !item.is_visible).length,
    featured: items.filter(item => item.is_featured).length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h3 className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">Perguntas frequentes</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-[#a8b9a8]">
            <span className="border border-[#2d6a4f]/30 px-2.5 py-1.5">{metrics.total} ativas</span>
            <span className="border border-[#2d6a4f]/30 px-2.5 py-1.5">{metrics.visible} visíveis</span>
            <span className="border border-[#2d6a4f]/30 px-2.5 py-1.5">{metrics.hidden} ocultas</span>
            <span className="border border-[#2d6a4f]/30 px-2.5 py-1.5">{metrics.featured} destaques</span>
          </div>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 bg-[#c9a84c] px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a0f]"><Plus size={15} />Nova pergunta</button>
      </div>

      {metrics.featured > 20 && <div className="mb-5 border border-[#c9a84c]/45 bg-[#c9a84c]/10 p-3 text-xs text-[#e4cb84]">Há mais de 20 perguntas em destaque. A abertura da seção pode ficar longa.</div>}

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pergunta, resposta ou slug" className={`${controlClass} md:col-span-2`} />
        <select value={categoryId} onChange={event => setCategoryId(event.target.value)} className={controlClass}><option value="">Todas as categorias</option>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
        <select value={visibility} onChange={event => setVisibility(event.target.value as FaqVisibilityFilter)} className={controlClass}><option value="all">Todas</option><option value="visible">Visíveis</option><option value="hidden">Ocultas</option></select>
        <select value={featured} onChange={event => setFeatured(event.target.value as FaqFeaturedFilter)} className={controlClass}><option value="all">Todos os destaques</option><option value="featured">Em destaque</option><option value="regular">Regulares</option></select>
        <select value={sort} onChange={event => setSort(event.target.value as FaqSort)} className={controlClass}><option value="page-order">Ordem da página</option><option value="newest">Mais recentes</option><option value="alphabetical">A–Z</option></select>
      </div>

      <div className="space-y-3">
        {filtered.map(item => {
          const category = categoryById.get(item.category_id);
          const disabled = Boolean(busyId);
          return <article key={item.id} className="border border-[#2d6a4f]/25 bg-[#0a120a] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#f0ebe0]">{item.question}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-[#6f8a6f]">
                  <span>{category?.label ?? "Sem categoria"}</span><span>Ordem {item.sort_order}</span><span>{item.is_visible ? "Visível" : "Oculta"}</span><span>{item.is_featured ? "Destaque" : "Regular"}</span><span>Atualizada {new Date(item.updated_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <select aria-label={`Mover ${item.question} de categoria`} value={item.category_id} disabled={disabled} onChange={event => onMoveCategory(item, event.target.value)} className={`${controlClass} xl:w-48`}>{categories.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-label="Mover para cima" disabled={disabled} onClick={() => onMoveOrder(item, -1)} className={actionClass}><ArrowUp size={13} /></button>
                <button type="button" aria-label="Mover para baixo" disabled={disabled} onClick={() => onMoveOrder(item, 1)} className={actionClass}><ArrowDown size={13} /></button>
                <button type="button" disabled={disabled} onClick={() => onEdit(item)} className={actionClass}><Pencil size={13} />Editar</button>
                <button type="button" disabled={disabled} onClick={() => onVisibility(item)} className={actionClass}>{item.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}{item.is_visible ? "Ocultar" : "Exibir"}</button>
                <button type="button" disabled={disabled} onClick={() => onFeatured(item)} className={`${actionClass} ${item.is_featured ? "border-[#c9a84c]/60 text-[#c9a84c]" : ""}`}><Star size={13} />{item.is_featured ? "Remover destaque" : "Destacar"}</button>
                <button type="button" disabled={disabled} onClick={() => onDelete(item)} className={`${actionClass} border-[#9b3d35]/45 text-[#d77970]`}><Trash2 size={13} />Apagar</button>
              </div>
            </div>
          </article>;
        })}
        {!filtered.length && <div className="border border-[#2d6a4f]/25 bg-[#0a120a] p-8 text-center text-sm text-[#7a9a7a]">Nenhuma pergunta corresponde aos filtros.</div>}
      </div>
    </div>
  );
}
