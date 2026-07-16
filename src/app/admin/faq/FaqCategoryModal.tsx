import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { EditableFaqCategory, FaqCategoryFormValue, FaqModalBaseProps } from "./faqAdmin.types";

interface FaqCategoryModalProps extends FaqModalBaseProps {
  category: EditableFaqCategory;
  onSubmit: (value: FaqCategoryFormValue) => Promise<boolean>;
}

const inputClass = "w-full border border-[#2d6a4f]/35 bg-[#0a120a] px-4 py-3 text-sm text-[#f0ebe0] outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/25";

export function FaqCategoryModal({ open, category, busy, onClose, onSubmit }: FaqCategoryModalProps) {
  const [value, setValue] = useState<FaqCategoryFormValue>({ key: "", label: "", description: null, sort_order: 0, is_visible: true });

  useEffect(() => {
    setValue(category ? {
      key: category.key,
      label: category.label,
      description: category.description,
      sort_order: category.sort_order,
      is_visible: category.is_visible,
    } : { key: "", label: "", description: null, sort_order: 0, is_visible: true });
  }, [category, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSubmit(value)) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !busy) onClose(); }}>
      <DialogContent className="border-[#2d6a4f]/40 bg-[#141f14] text-[#f0ebe0] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-['Playfair_Display'] text-2xl">{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription className="text-[#7a9a7a]">Organize as perguntas sem alterar o conteúdo de cada resposta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Nome
            <input required value={value.label} onChange={event => setValue(current => ({ ...current, label: event.target.value }))} className={`${inputClass} mt-2`} />
          </label>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Chave
            <input required disabled={Boolean(category)} value={value.key} onChange={event => setValue(current => ({ ...current, key: event.target.value }))} className={`${inputClass} mt-2 disabled:cursor-not-allowed disabled:opacity-60`} />
          </label>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Descrição
            <textarea rows={3} value={value.description ?? ""} onChange={event => setValue(current => ({ ...current, description: event.target.value || null }))} className={`${inputClass} mt-2 resize-y`} />
          </label>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Ordem
            <input required type="number" min={0} step={1} value={value.sort_order} onChange={event => setValue(current => ({ ...current, sort_order: Number(event.target.value) }))} className={`${inputClass} mt-2`} />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#d5dfd5]">
            <input type="checkbox" checked={value.is_visible} onChange={event => setValue(current => ({ ...current, is_visible: event.target.checked }))} /> Visível na Home
          </label>
          <DialogFooter>
            <button type="button" disabled={busy} onClick={onClose} className="border border-[#2d6a4f]/40 px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Cancelar</button>
            <button type="submit" disabled={busy} className="bg-[#c9a84c] px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a0f] disabled:opacity-50">{busy ? "Salvando..." : "Salvar categoria"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
