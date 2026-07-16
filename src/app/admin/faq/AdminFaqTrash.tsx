import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import type { DbAdminUser, DbFaqCategory, DbFaqItem } from "../../../lib/database.types";

interface AdminFaqTrashProps {
  deletedItems: DbFaqItem[];
  deletedCategories: DbFaqCategory[];
  activeCategories: DbFaqCategory[];
  allCategories: DbFaqCategory[];
  adminUsers: DbAdminUser[];
  isSuperadmin: boolean;
  busyId: string;
  onRestoreItem: (item: DbFaqItem) => void;
  onMoveAndRestoreItem: (item: DbFaqItem, categoryId: string) => void;
  onDeleteItem: (item: DbFaqItem) => void;
  onRestoreCategory: (category: DbFaqCategory) => void;
  onDeleteCategory: (category: DbFaqCategory) => void;
}

const actionClass = "inline-flex items-center gap-1.5 border border-[#2d6a4f]/35 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#a8b9a8] transition hover:border-[#c9a84c] hover:text-[#f0ebe0] disabled:opacity-40";
const selectClass = "border border-[#2d6a4f]/35 bg-[#141f14] px-3 py-2 text-xs text-[#f0ebe0] outline-none";

function requireStrongConfirmation(label: string): boolean {
  return window.prompt(`Para excluir definitivamente “${label}”, digite EXCLUIR.`) === "EXCLUIR";
}

export function AdminFaqTrash({ deletedItems, deletedCategories, activeCategories, allCategories, adminUsers, isSuperadmin, busyId, onRestoreItem, onMoveAndRestoreItem, onDeleteItem, onRestoreCategory, onDeleteCategory }: AdminFaqTrashProps) {
  const [restoreTargets, setRestoreTargets] = useState<Record<string, string>>({});
  const adminById = new Map(adminUsers.map(admin => [admin.id, admin]));
  const categoryById = new Map(allCategories.map(category => [category.id, category]));

  return (
    <div>
      <div className="mb-6"><h3 className="font-['Playfair_Display'] text-3xl font-bold text-[#f0ebe0]">Lixeira</h3><p className="mt-1 text-sm text-[#7a9a7a]">Restaure conteúdo ou, como superadmin, exclua definitivamente.</p></div>
      <div className="space-y-8">
        <section>
          <h4 className="mb-3 text-xs font-mono uppercase tracking-wider text-[#c9a84c]">Perguntas apagadas ({deletedItems.length})</h4>
          <div className="space-y-3">
            {deletedItems.map(item => {
              const category = categoryById.get(item.category_id);
              const categoryDeleted = Boolean(category?.deleted_at);
              const deletedBy = item.deleted_by_admin_id ? adminById.get(item.deleted_by_admin_id) : null;
              return <article key={item.id} className="border border-[#2d6a4f]/25 bg-[#0a120a] p-4">
                <p className="font-semibold text-[#f0ebe0]">{item.question}</p>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-[#6f8a6f]">{category?.label ?? "Categoria indisponível"} · {item.deleted_at ? new Date(item.deleted_at).toLocaleString("pt-BR") : "Data indisponível"} · {deletedBy?.display_name ?? deletedBy?.email ?? item.deleted_by_admin_id ?? "Usuário não informado"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {categoryDeleted ? <>
                    <select aria-label={`Nova categoria para ${item.question}`} value={restoreTargets[item.id] ?? ""} onChange={event => setRestoreTargets(current => ({ ...current, [item.id]: event.target.value }))} className={selectClass}><option value="" disabled>Mover para categoria ativa</option>{activeCategories.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
                    <button type="button" disabled={Boolean(busyId) || !restoreTargets[item.id]} onClick={() => onMoveAndRestoreItem(item, restoreTargets[item.id])} className={actionClass}><RotateCcw size={13} />Mover e restaurar</button>
                  </> : <button type="button" disabled={Boolean(busyId)} onClick={() => onRestoreItem(item)} className={actionClass}><RotateCcw size={13} />Restaurar</button>}
                  {isSuperadmin && <button type="button" disabled={Boolean(busyId)} onClick={() => { if (requireStrongConfirmation(item.question)) onDeleteItem(item); }} className={`${actionClass} border-[#9b3d35]/45 text-[#d77970]`}><Trash2 size={13} />Excluir definitivamente</button>}
                </div>
              </article>;
            })}
            {!deletedItems.length && <p className="border border-[#2d6a4f]/25 bg-[#0a120a] p-6 text-sm text-[#7a9a7a]">Nenhuma pergunta na lixeira.</p>}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-mono uppercase tracking-wider text-[#c9a84c]">Categorias apagadas ({deletedCategories.length})</h4>
          <div className="space-y-3">
            {deletedCategories.map(category => {
              const deletedBy = category.deleted_by_admin_id ? adminById.get(category.deleted_by_admin_id) : null;
              return <article key={category.id} className="border border-[#2d6a4f]/25 bg-[#0a120a] p-4">
                <p className="font-semibold text-[#f0ebe0]">{category.label}</p>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-[#6f8a6f]">{category.deleted_at ? new Date(category.deleted_at).toLocaleString("pt-BR") : "Data indisponível"} · {deletedBy?.display_name ?? deletedBy?.email ?? category.deleted_by_admin_id ?? "Usuário não informado"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(busyId)} onClick={() => onRestoreCategory(category)} className={actionClass}><RotateCcw size={13} />Restaurar</button>
                  {isSuperadmin && <button type="button" disabled={Boolean(busyId)} onClick={() => { if (requireStrongConfirmation(category.label)) onDeleteCategory(category); }} className={`${actionClass} border-[#9b3d35]/45 text-[#d77970]`}><Trash2 size={13} />Excluir definitivamente</button>}
                </div>
              </article>;
            })}
            {!deletedCategories.length && <p className="border border-[#2d6a4f]/25 bg-[#0a120a] p-6 text-sm text-[#7a9a7a]">Nenhuma categoria na lixeira.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
