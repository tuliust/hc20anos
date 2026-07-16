import { useEffect, useState } from "react";
import type { DbFaqCategory } from "../../../lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { EditableFaqItem, FaqItemFormValue, FaqModalBaseProps } from "./faqAdmin.types";

interface FaqItemModalProps extends FaqModalBaseProps {
  item: EditableFaqItem;
  categories: DbFaqCategory[];
  onSubmit: (value: FaqItemFormValue) => Promise<boolean>;
}

const inputClass = "w-full border border-[#2d6a4f]/35 bg-[#0a120a] px-4 py-3 text-sm text-[#f0ebe0] outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/25";

export function FaqItemModal({ open, item, categories, busy, onClose, onSubmit }: FaqItemModalProps) {
  const [value, setValue] = useState<FaqItemFormValue>({
    question: "",
    answer: "",
    category_id: "",
    slug: "",
    sort_order: 0,
    is_visible: true,
    is_featured: false,
  });

  useEffect(() => {
    setValue(item ? {
      question: item.question,
      answer: item.answer,
      category_id: item.category_id,
      slug: item.slug,
      sort_order: item.sort_order,
      is_visible: item.is_visible,
      is_featured: item.is_featured,
    } : {
      question: "",
      answer: "",
      category_id: categories[0]?.id ?? "",
      slug: "",
      sort_order: 0,
      is_visible: true,
      is_featured: false,
    });
  }, [categories, item, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSubmit(value)) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !busy) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#2d6a4f]/40 bg-[#141f14] text-[#f0ebe0] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-['Playfair_Display'] text-2xl">{item ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
          <DialogDescription className="text-[#7a9a7a]">A alteração afeta somente este registro do FAQ.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">
            Pergunta
            <input required value={value.question} onChange={event => setValue(current => ({ ...current, question: event.target.value }))} className={`${inputClass} mt-2`} />
          </label>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">
            Resposta
            <textarea required rows={6} value={value.answer} onChange={event => setValue(current => ({ ...current, answer: event.target.value }))} className={`${inputClass} mt-2 resize-y`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">
              Categoria
              <select required value={value.category_id} onChange={event => setValue(current => ({ ...current, category_id: event.target.value }))} className={`${inputClass} mt-2`}>
                <option value="" disabled>Selecione</option>
                {categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">
              Ordem
              <input required type="number" min={0} step={1} value={value.sort_order} onChange={event => setValue(current => ({ ...current, sort_order: Number(event.target.value) }))} className={`${inputClass} mt-2`} />
            </label>
          </div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">
            Slug {item && <span className="normal-case tracking-normal text-[#5f775f]">(estável após a criação)</span>}
            <input disabled={Boolean(item)} value={value.slug ?? ""} onChange={event => setValue(current => ({ ...current, slug: event.target.value }))} placeholder="Gerado automaticamente" className={`${inputClass} mt-2 disabled:cursor-not-allowed disabled:opacity-60`} />
          </label>
          <div className="flex flex-wrap gap-5 border border-[#2d6a4f]/25 bg-[#0a120a] p-4">
            <label className="inline-flex items-center gap-2 text-sm text-[#d5dfd5]">
              <input type="checkbox" checked={value.is_visible} onChange={event => setValue(current => ({ ...current, is_visible: event.target.checked }))} /> Visível
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#d5dfd5]">
              <input type="checkbox" checked={value.is_featured} onChange={event => setValue(current => ({ ...current, is_featured: event.target.checked }))} /> Em destaque
            </label>
          </div>
          <DialogFooter>
            <button type="button" disabled={busy} onClick={onClose} className="border border-[#2d6a4f]/40 px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Cancelar</button>
            <button type="submit" disabled={busy || !categories.length} className="bg-[#c9a84c] px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a0f] disabled:opacity-50">{busy ? "Salvando..." : "Salvar pergunta"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
