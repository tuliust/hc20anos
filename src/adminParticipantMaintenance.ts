import { supabase } from "./lib/supabase";

const PARTICIPANTS_ROUTE = "/admin/participants";

let observer: MutationObserver | null = null;
let scheduled = false;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isParticipantsRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return path === PARTICIPANTS_ROUTE && (tab === null || tab === "participants");
}

function findEditModal(): HTMLElement | null {
  const title = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span"),
  ).find(node => normalize(node.textContent) === "editar participante");

  if (!title) return null;

  let current: HTMLElement | null = title;
  while (current && current !== document.body) {
    const buttons = Array.from(current.querySelectorAll<HTMLButtonElement>("button"));
    const hasSave = buttons.some(button => normalize(button.textContent).includes("salvar alteracoes"));
    const hasCancel = buttons.some(button => normalize(button.textContent) === "cancelar");
    if (hasSave && hasCancel) return current;
    current = current.parentElement;
  }

  return null;
}

function fieldValue(root: HTMLElement, labelText: string): string {
  const normalizedLabel = normalize(labelText);
  const labels = Array.from(root.querySelectorAll<HTMLLabelElement>("label"));
  const label = labels.find(candidate => normalize(candidate.textContent) === normalizedLabel);
  if (!label) return "";

  const container = label.parentElement;
  const control = container?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input,select,textarea",
  );

  return control?.value?.trim() ?? "";
}

async function resolvePersonId(modal: HTMLElement): Promise<string> {
  const fullName = fieldValue(modal, "Nome completo");
  const classGroup = fieldValue(modal, "Turma").toUpperCase();

  if (!fullName) throw new Error("Não foi possível identificar o participante selecionado.");

  let query = (supabase as any)
    .from("people")
    .select("id,full_name,class_group")
    .eq("full_name", fullName);

  if (classGroup) query = query.eq("class_group", classGroup);

  const { data, error } = await query.limit(2);
  if (error) throw error;

  const rows = (data ?? []) as { id: string; full_name: string; class_group: string | null }[];

  if (rows.length !== 1) {
    throw new Error(
      rows.length === 0
        ? "Participante não encontrado na base."
        : "Há mais de um participante com o mesmo nome e turma.",
    );
  }

  return rows[0].id;
}

function createActionButton(
  label: string,
  className: string,
  action: () => Promise<void>,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;

  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    button.disabled = true;
    void action()
      .catch(error => {
        const message = error instanceof Error
          ? error.message
          : "Não foi possível concluir a ação.";
        window.alert(message);
      })
      .finally(() => {
        if (document.contains(button)) button.disabled = false;
      });
  });

  return button;
}

function enhanceParticipantModal(): void {
  if (!isParticipantsRoute()) return;

  const modal = findEditModal();
  if (!modal || modal.querySelector("[data-hc-participant-maintenance]")) return;

  const saveButton = Array.from(modal.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalize(button.textContent).includes("salvar alteracoes"));

  if (!saveButton?.parentElement) return;

  const actions = document.createElement("div");
  actions.dataset.hcParticipantMaintenance = "true";
  actions.className = "contents";

  const clearButton = createActionButton(
    "Limpar",
    "w-full sm:w-auto border border-[#c9a84c]/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9a84c] hover:bg-[#c9a84c]/10 disabled:opacity-50 transition-colors",
    async () => {
      const fullName = fieldValue(modal, "Nome completo") || "este participante";
      const confirmed = window.confirm(
        `Limpar todos os dados de ${fullName}, preservando somente nome e turma? O perfil reivindicado será desvinculado.`,
      );
      if (!confirmed) return;

      const personId = await resolvePersonId(modal);
      const { error } = await (supabase as any).rpc("admin_clear_person_profile", {
        p_person_id: personId,
      });
      if (error) throw error;

      window.alert("Dados limpos. Nome e turma foram preservados.");
      window.location.reload();
    },
  );

  const removeButton = createActionButton(
    "Remover",
    "w-full sm:w-auto border border-[#c0392b]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#ff9d90] hover:bg-[#c0392b]/15 disabled:opacity-50 transition-colors",
    async () => {
      const fullName = fieldValue(modal, "Nome completo") || "este participante";
      const confirmed = window.confirm(
        `Remover definitivamente ${fullName} e todo o perfil associado? Esta ação não pode ser desfeita. Registros financeiros permanecem preservados sem vínculo pessoal.`,
      );
      if (!confirmed) return;

      const personId = await resolvePersonId(modal);
      const { error } = await (supabase as any).rpc("admin_delete_person_profile", {
        p_person_id: personId,
      });
      if (error) throw error;

      window.alert("Participante removido da base.");
      window.location.reload();
    },
  );

  actions.append(clearButton, removeButton);
  saveButton.parentElement.insertBefore(actions, saveButton);
}

function scheduleEnhancement(): void {
  if (scheduled) return;
  scheduled = true;

  window.setTimeout(() => {
    scheduled = false;
    try {
      enhanceParticipantModal();
    } catch (error) {
      console.error("Falha ao instalar ações de manutenção do participante", error);
    }
  }, 0);
}

export function installAdminParticipantMaintenance(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  observer?.disconnect();
  observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", scheduleEnhancement);
  window.addEventListener("pushstate", scheduleEnhancement as EventListener);
  scheduleEnhancement();
}
