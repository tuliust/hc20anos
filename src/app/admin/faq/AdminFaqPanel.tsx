import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRole, DbAdminUser, DbFaqCategory, DbFaqItem } from "../../../lib/database.types";
import {
  createFaqCategory,
  createFaqItem,
  getAdminFaqCategories,
  getAdminFaqItems,
  getPublicFaqData,
  moveFaqCategoryItems,
  moveFaqItem,
  permanentlyDeleteFaqCategory,
  permanentlyDeleteFaqItem,
  reorderFaqCategories,
  reorderFaqItems,
  restoreFaqCategory,
  restoreFaqItem,
  setFaqCategoryVisibility,
  setFaqItemFeatured,
  setFaqItemVisibility,
  softDeleteFaqCategory,
  softDeleteFaqItem,
  updateFaqCategory,
  updateFaqItem,
} from "../../../lib/faq";
import { AdminFaqCategories } from "./AdminFaqCategories";
import { AdminFaqQuestions } from "./AdminFaqQuestions";
import { AdminFaqTrash } from "./AdminFaqTrash";
import { FaqCategoryDeleteDialog } from "./FaqCategoryDeleteDialog";
import { FaqCategoryModal } from "./FaqCategoryModal";
import { FaqItemModal } from "./FaqItemModal";
import type { AdminFaqNotice, AdminFaqView, FaqCategoryFormValue, FaqItemFormValue } from "./faqAdmin.types";

export interface FaqSectionSettings {
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  emptyLabel: string;
  viewAllLabel: string;
  initialMode: "featured" | "all";
}

interface AdminFaqPanelProps {
  eventId: string;
  adminId: string | null;
  role: AdminRole | null;
  adminUsers: DbAdminUser[];
  sectionSettings: FaqSectionSettings;
  onSectionSettingsChange: (patch: Partial<FaqSectionSettings>) => void;
  onSaveSectionSettings: () => Promise<void>;
  notify: AdminFaqNotice;
}

function initialView(): AdminFaqView {
  if (typeof window === "undefined") return "questions";
  const value = new URLSearchParams(window.location.search).get("view");
  return value === "categories" || value === "trash" ? value : "questions";
}

export function AdminFaqPanel({ eventId, adminId, role, adminUsers, sectionSettings, onSectionSettingsChange, onSaveSectionSettings, notify }: AdminFaqPanelProps) {
  const [view, setViewState] = useState<AdminFaqView>(initialView);
  const [categories, setCategories] = useState<DbFaqCategory[]>([]);
  const [items, setItems] = useState<DbFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [legacySource, setLegacySource] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbFaqItem | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbFaqCategory | null>(null);
  const [blockedCategory, setBlockedCategory] = useState<DbFaqCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [nextCategories, nextItems, publicData] = await Promise.all([
        getAdminFaqCategories(eventId, { deleted: "all" }),
        getAdminFaqItems(eventId, { deleted: "all" }),
        getPublicFaqData(eventId),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
      setLegacySource(publicData.source === "legacy-json");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o FAQ estruturado.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const activeCategories = useMemo(() => categories.filter(category => !category.deleted_at).sort((a, b) => a.sort_order - b.sort_order), [categories]);
  const deletedCategories = useMemo(() => categories.filter(category => Boolean(category.deleted_at)), [categories]);
  const activeItems = useMemo(() => items.filter(item => !item.deleted_at), [items]);
  const deletedItems = useMemo(() => items.filter(item => Boolean(item.deleted_at)), [items]);

  function selectView(nextView: AdminFaqView) {
    setViewState(nextView);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "faq");
    url.searchParams.set("view", nextView);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  async function runAction(id: string, action: () => Promise<void>, success: string): Promise<boolean> {
    if (!adminId) {
      notify("Não foi possível identificar o registro administrativo atual.", "error");
      return false;
    }
    setBusyId(id);
    try {
      await action();
      notify(success, "success");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível concluir a ação.", "error");
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function submitItem(value: FaqItemFormValue): Promise<boolean> {
    if (!adminId) return runAction("item-save", async () => {}, "");
    return runAction("item-save", async () => {
      if (editingItem) {
        const updated = await updateFaqItem(editingItem.id, {
          question: value.question,
          answer: value.answer,
          category_id: value.category_id,
          sort_order: value.sort_order,
          is_visible: value.is_visible,
          is_featured: value.is_featured,
        }, adminId);
        setItems(current => current.map(item => item.id === updated.id ? updated : item));
      } else {
        const created = await createFaqItem({
          event_id: eventId,
          category_id: value.category_id,
          question: value.question,
          answer: value.answer,
          slug: value.slug?.trim() || undefined,
          sort_order: value.sort_order,
          is_visible: value.is_visible,
          is_featured: value.is_featured,
          admin_id: adminId,
        });
        setItems(current => [...current, created]);
      }
    }, editingItem ? "Pergunta atualizada." : "Pergunta criada.");
  }

  async function submitCategory(value: FaqCategoryFormValue): Promise<boolean> {
    if (!adminId) return runAction("category-save", async () => {}, "");
    return runAction("category-save", async () => {
      if (editingCategory) {
        const updated = await updateFaqCategory(editingCategory.id, {
          label: value.label,
          description: value.description,
          sort_order: value.sort_order,
          is_visible: value.is_visible,
        }, adminId);
        setCategories(current => current.map(category => category.id === updated.id ? updated : category));
        setItems(current => current.map(item => item.category_id === updated.id ? { ...item, category: updated } : item));
      } else {
        const created = await createFaqCategory({ event_id: eventId, ...value, admin_id: adminId });
        setCategories(current => [...current, created]);
      }
    }, editingCategory ? "Categoria atualizada." : "Categoria criada.");
  }

  async function toggleItemVisibility(item: DbFaqItem) {
    if (!adminId) return;
    await runAction(`item-visibility-${item.id}`, async () => {
      const updated = await setFaqItemVisibility(item.id, !item.is_visible, adminId);
      setItems(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, item.is_visible ? "Pergunta ocultada." : "Pergunta exibida.");
  }

  async function toggleItemFeatured(item: DbFaqItem) {
    if (!adminId) return;
    await runAction(`item-featured-${item.id}`, async () => {
      const updated = await setFaqItemFeatured(item.id, !item.is_featured, adminId);
      setItems(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, item.is_featured ? "Destaque removido." : "Pergunta destacada.");
  }

  async function changeItemCategory(item: DbFaqItem, categoryId: string) {
    if (!adminId || categoryId === item.category_id) return;
    const targetItems = activeItems.filter(candidate => candidate.category_id === categoryId);
    const nextOrder = targetItems.length ? Math.max(...targetItems.map(candidate => candidate.sort_order)) + 10 : 0;
    await runAction(`item-move-${item.id}`, async () => {
      const updated = await moveFaqItem(item.id, categoryId, nextOrder, adminId);
      setItems(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, "Pergunta movida.");
  }

  async function moveItemOrder(item: DbFaqItem, direction: -1 | 1) {
    if (!adminId) return;
    const siblings = activeItems.filter(candidate => candidate.category_id === item.category_id).sort((a, b) => a.sort_order - b.sort_order);
    const index = siblings.findIndex(candidate => candidate.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
    const order = siblings.map((candidate, position) => ({ id: candidate.id, sort_order: position * 10 }));
    await runAction(`item-order-${item.id}`, async () => {
      await reorderFaqItems(item.category_id, order, adminId);
      const byId = new Map(order.map(candidate => [candidate.id, candidate.sort_order]));
      setItems(current => current.map(candidate => byId.has(candidate.id) ? { ...candidate, sort_order: byId.get(candidate.id)! } : candidate));
    }, "Ordem atualizada.");
  }

  async function deleteItem(item: DbFaqItem) {
    if (!adminId) return;
    await runAction(`item-delete-${item.id}`, async () => {
      const updated = await softDeleteFaqItem(item.id, adminId);
      setItems(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, "Pergunta enviada para a lixeira.");
  }

  async function toggleCategoryVisibility(category: DbFaqCategory) {
    if (!adminId) return;
    await runAction(`category-visibility-${category.id}`, async () => {
      const updated = await setFaqCategoryVisibility(category.id, !category.is_visible, adminId);
      setCategories(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, category.is_visible ? "Categoria ocultada." : "Categoria exibida.");
  }

  async function requestCategoryDelete(category: DbFaqCategory) {
    if (!adminId) return;
    const count = activeItems.filter(item => item.category_id === category.id).length;
    if (count > 0) {
      setBlockedCategory(category);
      return;
    }
    await runAction(`category-delete-${category.id}`, async () => {
      const updated = await softDeleteFaqCategory(category.id, adminId);
      setCategories(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, "Categoria enviada para a lixeira.");
  }

  async function moveAndDeleteBlockedCategory(targetCategoryId: string): Promise<boolean> {
    if (!blockedCategory || !adminId) return false;
    const sourceId = blockedCategory.id;
    const movedItems = activeItems.filter(item => item.category_id === sourceId).sort((a, b) => a.sort_order - b.sort_order);
    const targetItems = activeItems.filter(item => item.category_id === targetCategoryId);
    const baseOrder = targetItems.length ? Math.max(...targetItems.map(item => item.sort_order)) : -10;
    return runAction(`category-move-delete-${sourceId}`, async () => {
      await moveFaqCategoryItems(sourceId, targetCategoryId, adminId);
      const deleted = await softDeleteFaqCategory(sourceId, adminId);
      setItems(current => current.map(item => {
        const position = movedItems.findIndex(candidate => candidate.id === item.id);
        return position >= 0 ? { ...item, category_id: targetCategoryId, sort_order: baseOrder + (position + 1) * 10 } : item;
      }));
      setCategories(current => current.map(category => category.id === deleted.id ? deleted : category));
    }, "Perguntas movidas e categoria enviada para a lixeira.");
  }

  async function moveCategoryOrder(category: DbFaqCategory, direction: -1 | 1) {
    if (!adminId) return;
    const ordered = [...activeCategories];
    const index = ordered.findIndex(candidate => candidate.id === category.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const order = ordered.map((candidate, position) => ({ id: candidate.id, sort_order: (position + 1) * 10 }));
    await runAction(`category-order-${category.id}`, async () => {
      await reorderFaqCategories(eventId, order, adminId);
      const byId = new Map(order.map(candidate => [candidate.id, candidate.sort_order]));
      setCategories(current => current.map(candidate => byId.has(candidate.id) ? { ...candidate, sort_order: byId.get(candidate.id)! } : candidate));
    }, "Ordem das categorias atualizada.");
  }

  async function restoreDeletedItem(item: DbFaqItem) {
    if (!adminId) return;
    await runAction(`item-restore-${item.id}`, async () => {
      const updated = await restoreFaqItem(item.id, adminId);
      setItems(current => current.map(candidate => candidate.id === updated.id ? updated : candidate));
    }, "Pergunta restaurada.");
  }

  async function moveAndRestoreDeletedItem(item: DbFaqItem, categoryId: string) {
    if (!adminId) return;
    await runAction(`item-move-restore-${item.id}`, async () => {
      await updateFaqItem(item.id, { category_id: categoryId }, adminId);
      const restored = await restoreFaqItem(item.id, adminId);
      setItems(current => current.map(candidate => candidate.id === restored.id ? restored : candidate));
    }, "Pergunta movida e restaurada.");
  }

  async function restoreDeletedCategory(category: DbFaqCategory) {
    if (!adminId) return;
    await runAction(`category-restore-${category.id}`, async () => {
      const restored = await restoreFaqCategory(category.id, adminId);
      setCategories(current => current.map(candidate => candidate.id === restored.id ? restored : candidate));
    }, "Categoria restaurada.");
  }

  async function permanentlyRemoveItem(item: DbFaqItem) {
    await runAction(`item-permanent-${item.id}`, async () => {
      await permanentlyDeleteFaqItem(item.id);
      setItems(current => current.filter(candidate => candidate.id !== item.id));
    }, "Pergunta excluída definitivamente.");
  }

  async function permanentlyRemoveCategory(category: DbFaqCategory) {
    await runAction(`category-permanent-${category.id}`, async () => {
      await permanentlyDeleteFaqCategory(category.id);
      setCategories(current => current.filter(candidate => candidate.id !== category.id));
    }, "Categoria excluída definitivamente.");
  }

  async function saveSectionSettings() {
    await runAction("section-settings", onSaveSectionSettings, "Configurações da seção salvas.");
  }

  if (loading) return <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-8 text-sm text-[#7a9a7a]">Carregando FAQ estruturado...</div>;
  if (loadError) return <div className="border border-[#9b3d35]/45 bg-[#281412] p-6 text-sm text-[#e29a92]"><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-4 border border-[#e29a92]/50 px-4 py-2 text-xs font-mono uppercase">Tentar novamente</button></div>;

  return (
    <div className="space-y-5" data-admin-faq-panel>
      {legacySource && <div className="border border-[#c9a84c]/45 bg-[#c9a84c]/10 p-4 text-sm text-[#e4cb84]"><strong>Compatibilidade temporária:</strong> a tabela estruturada ainda está vazia; a Home está lendo `faq_items_json`. Crie ou migre perguntas aqui para desativar o fallback. Este painel nunca grava o JSON legado.</div>}

      <section className="border border-[#2d6a4f]/25 bg-[#141f14] p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-mono uppercase tracking-wider text-[#c9a84c]">Configurações da seção</p><p className="mt-1 text-xs text-[#6f8a6f]">Somente títulos, mensagens e modo inicial; perguntas ficam nas tabelas relacionais.</p></div><button type="button" disabled={Boolean(busyId)} onClick={() => void saveSectionSettings()} className="border border-[#c9a84c] px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#c9a84c] disabled:opacity-50">Salvar configurações</button></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input aria-label="Eyebrow FAQ" value={sectionSettings.eyebrow} onChange={event => onSectionSettingsChange({ eyebrow: event.target.value })} placeholder="Eyebrow" className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]" />
          <input aria-label="Título FAQ" value={sectionSettings.title} onChange={event => onSectionSettingsChange({ title: event.target.value })} placeholder="Título" className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]" />
          <input aria-label="Placeholder da busca" value={sectionSettings.searchPlaceholder} onChange={event => onSectionSettingsChange({ searchPlaceholder: event.target.value })} placeholder="Placeholder da busca" className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]" />
          <input aria-label="Mensagem vazia" value={sectionSettings.emptyLabel} onChange={event => onSectionSettingsChange({ emptyLabel: event.target.value })} placeholder="Mensagem de estado vazio" className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]" />
          <input aria-label="Label ver todas" value={sectionSettings.viewAllLabel} onChange={event => onSectionSettingsChange({ viewAllLabel: event.target.value })} placeholder="Label Ver todas" className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]" />
          <select aria-label="Modo inicial" value={sectionSettings.initialMode} onChange={event => onSectionSettingsChange({ initialMode: event.target.value as "featured" | "all" })} className="border border-[#2d6a4f]/35 bg-[#0a120a] px-3 py-2.5 text-sm text-[#f0ebe0]"><option value="featured">Destaques primeiro</option><option value="all">Mostrar todas</option></select>
        </div>
      </section>

      <section className="border border-[#2d6a4f]/25 bg-[#141f14] p-5 sm:p-6">
        <div className="mb-6 flex gap-2 border-b border-[#2d6a4f]/20 pb-4">
          {(["questions", "categories", "trash"] as AdminFaqView[]).map(option => <button key={option} type="button" onClick={() => selectView(option)} className={`border px-4 py-2 text-[11px] font-mono uppercase tracking-wider ${view === option ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/35 text-[#a8b9a8]"}`}>{option === "questions" ? "Perguntas" : option === "categories" ? "Categorias" : "Lixeira"}</button>)}
        </div>

        {view === "questions" && <AdminFaqQuestions items={activeItems} categories={activeCategories} busyId={busyId} onCreate={() => { setEditingItem(null); setItemModalOpen(true); }} onEdit={item => { setEditingItem(item); setItemModalOpen(true); }} onVisibility={item => void toggleItemVisibility(item)} onFeatured={item => void toggleItemFeatured(item)} onMoveCategory={(item, categoryId) => void changeItemCategory(item, categoryId)} onMoveOrder={(item, direction) => void moveItemOrder(item, direction)} onDelete={item => void deleteItem(item)} />}
        {view === "categories" && <AdminFaqCategories categories={activeCategories} items={activeItems} busyId={busyId} onCreate={() => { setEditingCategory(null); setCategoryModalOpen(true); }} onEdit={category => { setEditingCategory(category); setCategoryModalOpen(true); }} onVisibility={category => void toggleCategoryVisibility(category)} onDelete={category => void requestCategoryDelete(category)} onMoveOrder={(category, direction) => void moveCategoryOrder(category, direction)} />}
        {view === "trash" && <AdminFaqTrash deletedItems={deletedItems} deletedCategories={deletedCategories} activeCategories={activeCategories} allCategories={categories} adminUsers={adminUsers} isSuperadmin={role === "superadmin"} busyId={busyId} onRestoreItem={item => void restoreDeletedItem(item)} onMoveAndRestoreItem={(item, categoryId) => void moveAndRestoreDeletedItem(item, categoryId)} onDeleteItem={item => void permanentlyRemoveItem(item)} onRestoreCategory={category => void restoreDeletedCategory(category)} onDeleteCategory={category => void permanentlyRemoveCategory(category)} />}
      </section>

      <FaqItemModal open={itemModalOpen} item={editingItem} categories={activeCategories} busy={busyId === "item-save"} onClose={() => setItemModalOpen(false)} onSubmit={submitItem} />
      <FaqCategoryModal open={categoryModalOpen} category={editingCategory} busy={busyId === "category-save"} onClose={() => setCategoryModalOpen(false)} onSubmit={submitCategory} />
      <FaqCategoryDeleteDialog category={blockedCategory} itemCount={blockedCategory ? activeItems.filter(item => item.category_id === blockedCategory.id).length : 0} targets={activeCategories.filter(category => category.id !== blockedCategory?.id)} busy={busyId.startsWith("category-move-delete-")} onClose={() => setBlockedCategory(null)} onMoveAndDelete={moveAndDeleteBlockedCategory} />
    </div>
  );
}
