import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { DbFaqCategory, DbFaqItem } from "../../../lib/database.types";

interface AdminFaqCategoriesProps {
  categories: DbFaqCategory[];
  items: DbFaqItem[];
  busyId: string;
  onCreate: () => void;
  onEdit: (category: DbFaqCategory) => void;
  onVisibility: (category: DbFaqCategory) => void;
  onDelete: (category: DbFaqCategory) => void;
  onMoveOrder: (category: DbFaqCategory, direction: -1 | 1) => void;
}

const actionClass = "inline-flex items-center gap-1.5 border border-[#2d6a4f]/35 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#a8b9a8] transition hover:border-[#c9a84c] hover:text-[#f0ebe0] disabled:opacity-40";

export function AdminFaqCategories({ categories, items, busyId, onCreate, onEdit, onVisibility, onDelete, onMoveOrder }: AdminFaqCategoriesProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h3 className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">Categorias</h3><p className="mt-1 text-sm text-[#7a9a7a]">Organização, ordem e visibilidade da Home.</p></div>
        <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 bg-[#c9a84c] px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a0f]"><Plus size={15} />Nova categoria</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map(category => {
          const count = items.filter(item => item.category_id === category.id).length;
          return <article key={category.id} className="border border-[#2d6a4f]/25 bg-[#0a120a] p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h4 className="font-['Playfair_Display'] text-xl font-bold text-[#f0ebe0]">{category.label}</h4><p className="mt-1 text-xs text-[#6f8a6f]">{count} pergunta(s) · {category.is_visible ? "Visível" : "Oculta"} · Ordem {category.sort_order}</p></div>
              <span className="border border-[#2d6a4f]/30 px-2 py-1 text-[10px] font-mono text-[#7a9a7a]">{category.key}</span>
            </div>
            {category.description && <p className="mt-4 text-sm leading-relaxed text-[#a8b9a8]">{category.description}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" aria-label="Mover categoria para cima" disabled={Boolean(busyId)} onClick={() => onMoveOrder(category, -1)} className={actionClass}><ArrowUp size={13} /></button>
              <button type="button" aria-label="Mover categoria para baixo" disabled={Boolean(busyId)} onClick={() => onMoveOrder(category, 1)} className={actionClass}><ArrowDown size={13} /></button>
              <button type="button" disabled={Boolean(busyId)} onClick={() => onEdit(category)} className={actionClass}><Pencil size={13} />Editar</button>
              <button type="button" disabled={Boolean(busyId)} onClick={() => onVisibility(category)} className={actionClass}>{category.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}{category.is_visible ? "Ocultar" : "Exibir"}</button>
              <button type="button" disabled={Boolean(busyId)} onClick={() => onDelete(category)} className={`${actionClass} border-[#9b3d35]/45 text-[#d77970]`}><Trash2 size={13} />Apagar</button>
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}
