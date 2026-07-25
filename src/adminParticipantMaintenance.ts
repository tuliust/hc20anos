import { supabase } from "./lib/supabase";
import { importPeopleAdmin, type AdminImportPersonInput } from "./lib/services";

const PARTICIPANTS_ROUTE = "/admin/participants";
const HOME_TICKETS_STYLE_ID = "hc-home-tickets-refinements-style";

let observer: MutationObserver | null = null;
let scheduled = false;
let importGridResizeObserver: ResizeObserver | null = null;
const observedImportGrids = new WeakSet<HTMLElement>();

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isParticipantsRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return path === PARTICIPANTS_ROUTE && (tab === null || tab === "participants");
}

function injectHomeTicketsStyles(): void {
  if (document.getElementById(HOME_TICKETS_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = HOME_TICKETS_STYLE_ID;
  style.textContent = `
    [data-home-ticket-amenities] [data-home-ticket-amenity] {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    [data-home-ticket-amenities] [data-home-ticket-amenity-icon] {
      margin-left: auto;
      margin-right: auto;
    }

    [data-home-ticket-amenities] h3 {
      color: #0d1a0f !important;
      text-align: center;
    }

    [data-home-ticket-amenities] p {
      color: #050805 !important;
      text-align: center;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child > div:first-child {
      display: flex;
      flex-direction: column;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:first-child > div:first-child > p:first-child {
      order: 1;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] [data-ticket-card-subtitle] {
      order: 2;
      margin-top: 1.35rem !important;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] h2 {
      order: 3;
      margin-top: 0.8rem !important;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:nth-child(2) {
      margin-top: 1rem !important;
      margin-bottom: 1rem !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > p {
      margin-bottom: 1.75rem !important;
    }

    @media (max-width: 767px) {
      [data-home-ticket-amenities] [data-home-ticket-amenity] {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
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

function findImportModal(): HTMLElement | null {
  const title = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span"),
  ).find(node => normalize(node.textContent) === "cadastrar pessoas");

  if (!title) return null;

  let current: HTMLElement | null = title;
  while (current && current !== document.body) {
    const text = normalize(current.textContent);
    const buttons = Array.from(current.querySelectorAll<HTMLButtonElement>("button"));
    const hasAddRow = buttons.some(button => normalize(button.textContent) === "adicionar linha");
    const hasCancel = buttons.some(button => normalize(button.textContent) === "cancelar");
    if (hasAddRow && hasCancel && text.includes("cadastro manual")) return current;
    current = current.parentElement;
  }

  return null;
}

function directGridChild(node: HTMLElement | null, grid: HTMLElement): HTMLElement | null {
  let current = node;
  while (current?.parentElement && current.parentElement !== grid) current = current.parentElement;
  return current?.parentElement === grid ? current : null;
}

function findFieldContainer(grid: HTMLElement, labelText: string): HTMLElement | null {
  const target = normalize(labelText);
  const label = Array.from(grid.querySelectorAll<HTMLLabelElement>("label"))
    .find(candidate => normalize(candidate.textContent).startsWith(target));
  return directGridChild(label, grid);
}

function findManualRowGrid(label: HTMLLabelElement, modal: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = label.parentElement;
  while (current && current !== modal) {
    if (
      current.classList.contains("grid")
      && Array.from(current.querySelectorAll<HTMLLabelElement>("label"))
        .some(candidate => normalize(candidate.textContent).startsWith("whatsapp"))
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function setGridColumn(element: HTMLElement | null, value: string): void {
  if (!element) return;
  element.style.gridColumn = value;
  element.style.minWidth = "0";
}

function fieldValue(root: HTMLElement, labelText: string): string {
  const target = normalize(labelText);
  const label = Array.from(root.querySelectorAll<HTMLLabelElement>("label"))
    .find(candidate => normalize(candidate.textContent).startsWith(target));
  if (!label) return "";

  const container = directGridChild(label, root) ?? label.parentElement;
  const control = container?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input,select,textarea",
  );
  return control?.value?.trim() ?? "";
}

function hideBirthYearField(grid: HTMLElement): void {
  const birthYear = findFieldContainer(grid, "Ano");
  if (!birthYear) return;
  birthYear.style.display = "none";
  birthYear.setAttribute("aria-hidden", "true");
}

function applyManualGridLayout(grid: HTMLElement): void {
  const width = grid.getBoundingClientRect().width;
  const fullName = findFieldContainer(grid, "Nome completo");
  const displayName = findFieldContainer(grid, "Nome de exibição");
  const gender = findFieldContainer(grid, "Gênero");
  const classGroup = findFieldContainer(grid, "Turma");
  const whatsapp = findFieldContainer(grid, "WhatsApp");
  const email = findFieldContainer(grid, "E-mail");
  const removeButton = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalize(button.textContent).includes("remover"));
  const remove = directGridChild(removeButton, grid);

  hideBirthYearField(grid);
  grid.dataset.hcParticipantManualGrid = "true";
  grid.style.alignItems = "end";

  if (width >= 760) {
    grid.style.gridTemplateColumns = "repeat(12, minmax(0, 1fr))";
    setGridColumn(fullName, "1 / span 7");
    setGridColumn(displayName, "8 / span 5");
    setGridColumn(gender, "1 / span 6");
    setGridColumn(classGroup, "7 / span 6");
    setGridColumn(whatsapp, "1 / span 5");
    setGridColumn(email, "6 / span 7");
    setGridColumn(remove, "1 / -1");
    return;
  }

  if (width >= 460) {
    grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    setGridColumn(fullName, "1 / -1");
    setGridColumn(displayName, "1 / -1");
    setGridColumn(gender, "1 / 2");
    setGridColumn(classGroup, "2 / 3");
    setGridColumn(whatsapp, "1 / -1");
    setGridColumn(email, "1 / -1");
    setGridColumn(remove, "1 / -1");
    return;
  }

  grid.style.gridTemplateColumns = "minmax(0, 1fr)";
  [fullName, displayName, gender, classGroup, whatsapp, email, remove]
    .forEach(element => setGridColumn(element, "1 / -1"));
}

function removeInternalImportScroll(modal: HTMLElement): void {
  Array.from(modal.querySelectorAll<HTMLElement>("div")).forEach(element => {
    const hasManualGrid = Boolean(element.querySelector("[data-hc-participant-manual-grid]"));
    const hasScrollClass = String(element.className).includes("overflow-y-auto")
      || String(element.className).includes("max-h-[560px]");
    if (!hasManualGrid || !hasScrollClass) return;

    element.style.maxHeight = "none";
    element.style.overflowY = "visible";
    element.style.paddingRight = "0";
  });
}

function avatarUrlForGrid(grid: HTMLElement): string {
  const row = grid.parentElement;
  const image = row?.querySelector<HTMLImageElement>("img");
  const src = image?.currentSrc || image?.src || "";
  return /^https?:\/\//i.test(src) ? src : "";
}

function collectManualRows(modal: HTMLElement): AdminImportPersonInput[] {
  const grids = Array.from(modal.querySelectorAll<HTMLElement>("[data-hc-participant-manual-grid]"));
  return grids.map(grid => ({
    full_name: fieldValue(grid, "Nome completo"),
    display_name: fieldValue(grid, "Nome de exibição"),
    gender: (fieldValue(grid, "Gênero") || null) as AdminImportPersonInput["gender"],
    birth_year: null,
    class_group: fieldValue(grid, "Turma").toUpperCase(),
    avatar_url: avatarUrlForGrid(grid),
    contact_whatsapp: fieldValue(grid, "WhatsApp"),
    contact_email: fieldValue(grid, "E-mail"),
  })).filter(row => row.full_name.trim() || row.class_group?.trim());
}

function installOptionalBirthYearSave(modal: HTMLElement): void {
  const saveButton = Array.from(modal.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => {
      const label = normalize(button.textContent);
      return label.startsWith("cadastrar") && label.includes("pessoas");
    });
  if (!saveButton || saveButton.dataset.hcOptionalBirthYearSave === "true") return;
  saveButton.dataset.hcOptionalBirthYearSave = "true";

  saveButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const rows = collectManualRows(modal);
    if (!rows.length || rows.some(row => !row.full_name.trim() || !row.class_group?.trim())) {
      window.alert("Inclua nome completo e turma para cada participante.");
      return;
    }

    const originalText = saveButton.textContent ?? "Cadastrar pessoas";
    saveButton.disabled = true;
    saveButton.textContent = "Cadastrando...";

    void supabase.auth.getSession()
      .then(async ({ data }) => {
        const adminId = data.session?.user?.id;
        if (!adminId) throw new Error("Sessão administrativa não encontrada.");
        await importPeopleAdmin(rows, adminId);
        window.location.reload();
      })
      .catch(error => {
        window.alert(error instanceof Error ? error.message : "Não foi possível cadastrar os participantes.");
        if (document.contains(saveButton)) {
          saveButton.disabled = false;
          saveButton.textContent = originalText;
        }
      });
  }, true);
}

function enhanceManualRegistrationLayout(): void {
  if (!isParticipantsRoute()) return;

  const modal = findImportModal();
  if (!modal) return;

  const grids = new Set<HTMLElement>();
  Array.from(modal.querySelectorAll<HTMLLabelElement>("label"))
    .filter(label => normalize(label.textContent).startsWith("nome completo"))
    .forEach(label => {
      const grid = findManualRowGrid(label, modal);
      if (grid) grids.add(grid);
    });

  grids.forEach(grid => {
    applyManualGridLayout(grid);
    if (observedImportGrids.has(grid) || typeof ResizeObserver === "undefined") return;

    importGridResizeObserver ??= new ResizeObserver(entries => {
      entries.forEach(entry => {
        if (entry.target instanceof HTMLElement && entry.target.isConnected) {
          applyManualGridLayout(entry.target);
        }
      });
    });
    importGridResizeObserver.observe(grid);
    observedImportGrids.add(grid);
  });

  removeInternalImportScroll(modal);
  installOptionalBirthYearSave(modal);
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
        window.alert(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
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
      const { error } = await (supabase as any).rpc("admin_clear_person_profile", { p_person_id: personId });
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
      const { error } = await (supabase as any).rpc("admin_delete_person_profile", { p_person_id: personId });
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
      injectHomeTicketsStyles();
      enhanceManualRegistrationLayout();
      enhanceParticipantModal();
    } catch (error) {
      console.error("Falha ao instalar melhorias administrativas de participantes", error);
    }
  }, 0);
}

export function installAdminParticipantMaintenance(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  injectHomeTicketsStyles();
  observer?.disconnect();
  observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("resize", scheduleEnhancement);
  window.addEventListener("popstate", scheduleEnhancement);
  window.addEventListener("pushstate", scheduleEnhancement as EventListener);
  scheduleEnhancement();
}
