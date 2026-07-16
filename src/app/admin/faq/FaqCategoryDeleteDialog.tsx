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

interface FaqCategoryDeleteDialogProps {
  category: DbFaqCategory | null;
  itemCount: number;
  targets: DbFaqCategory[];
  busy: boolean;
  onClose: () => void;
  onMoveAndDelete: (targetCategoryId: string) => Promise<boolean>;
}

export function FaqCategoryDeleteDialog({ category, itemCount, targets, busy, onClose, onMoveAndDelete }: FaqCategoryDeleteDialogProps) {
  const [targetId, setTargetId] = useState("");
  useEffect(() => setTargetId(targets[0]?.id ?? ""), [category, targets]);

  async function confirm() {
    if (targetId && await onMoveAndDelete(targetId)) onClose();
  }

  return (
    <Dialog open={Boolean(category)} onOpenChange={next => { if (!next && !busy) onClose(); }}>
      <DialogContent className="border-[#2d6a4f]/40 bg-[#141f14] text-[#f0ebe0] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['Playfair_Display'] text-2xl">Categoria com perguntas ativas</DialogTitle>
          <DialogDescription className="text-[#a8b9a8]">“{category?.label}” possui {itemCount} pergunta(s). Mova-as antes de enviar a categoria para a lixeira.</DialogDescription>
        </DialogHeader>
        <label className="block text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Categoria de destino
          <select value={targetId} onChange={event => setTargetId(event.target.value)} className="mt-2 w-full border border-[#2d6a4f]/35 bg-[#0a120a] px-4 py-3 text-sm text-[#f0ebe0] outline-none focus:border-[#c9a84c]">
            {targets.map(target => <option key={target.id} value={target.id}>{target.label}</option>)}
          </select>
        </label>
        <DialogFooter>
          <button type="button" disabled={busy} onClick={onClose} className="border border-[#2d6a4f]/40 px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#a8b9a8]">Cancelar</button>
          <button type="button" disabled={busy || !targetId} onClick={confirm} className="bg-[#c9a84c] px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a0f] disabled:opacity-50">{busy ? "Movendo..." : "Mover e apagar categoria"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
