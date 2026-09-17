import { supabase } from "./lib/supabase";

const FORM_SELECTOR = "[data-hc-external-user-form]";
const SUBMIT_SELECTOR = "[data-external-submit]";
const CONTEXT_ROOT_ATTRIBUTE = "data-hc-external-profile-context";
const PENDING_KEY = "hc-pending-external-profile-context-v1";
const STYLE_ID = "hc-external-profile-context-style";

type ExternalProfileContext = {
  studiedAtHc: boolean;
  classYear: number | null;
  classGroup: string | null;
  relationshipToClass: string | null;
};

let scheduled = false;
let flushInFlight = false;
let observer: MutationObserver | null = null;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${CONTEXT_ROOT_ATTRIBUTE}] {
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid rgba(45,106,79,.35);
      background: rgba(20,31,20,.72);
    }
    [${CONTEXT_ROOT_ATTRIBUTE}] .hc-external-context-title {
      margin: 0 0 .85rem;
      color: #f0ebe0;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 1.05rem;
      font-weight: 700;
    }
    [${CONTEXT_ROOT_ATTRIBUTE}] .hc-external-context-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: .9rem;
    }
    [${CONTEXT_ROOT_ATTRIBUTE}] label {
      display: flex;
      flex-direction: column;
      gap: .4rem;
      color: #8ab89a;
      font-size: .75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: .05em;
      text-transform: uppercase;
    }
    [${CONTEXT_ROOT_ATTRIBUTE}] label[data-wide="true"] { grid-column: 1 / -1; }
    [${CONTEXT_ROOT_ATTRIBUTE}] input,
    [${CONTEXT_ROOT_ATTRIBUTE}] select,
    [${CONTEXT_ROOT_ATTRIBUTE}] textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(45,106,79,.4);
      background: #141f14;
      color: #f0ebe0;
      padding: .85rem .9rem;
      outline: none;
      font: inherit;
      text-transform: none;
      letter-spacing: normal;
    }
    [${CONTEXT_ROOT_ATTRIBUTE}] textarea { min-height: 5.25rem; resize: vertical; }
    [${CONTEXT_ROOT_ATTRIBUTE}] input:focus,
    [${CONTEXT_ROOT_ATTRIBUTE}] select:focus,
    [${CONTEXT_ROOT_ATTRIBUTE}] textarea:focus { border-color: #c9a84c; }
    [${CONTEXT_ROOT_ATTRIBUTE}] [data-hc-context-conditional][hidden] { display: none !important; }
    @media (max-width: 640px) {
      [${CONTEXT_ROOT_ATTRIBUTE}] .hc-external-context-grid { grid-template-columns: 1fr; }
      [${CONTEXT_ROOT_ATTRIBUTE}] label[data-wide="true"] { grid-column: auto; }
    }
  `;
  document.head.appendChild(style);
}

function readPending(): ExternalProfileContext | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExternalProfileContext & { graduationYear?: number | null };
    if (typeof parsed?.studiedAtHc !== "boolean") return null;
    return {
      studiedAtHc: parsed.studiedAtHc,
      classYear: parsed.classYear ?? parsed.graduationYear ?? null,
      classGroup: parsed.classGroup ?? null,
      relationshipToClass: parsed.relationshipToClass ?? null,
    };
  } catch {
    return null;
  }
}

function savePending(context: ExternalProfileContext) {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(context));
}

function clearPending() {
  window.localStorage.removeItem(PENDING_KEY);
}

function setExternalStatus(form: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  const status = form.querySelector<HTMLElement>("[data-external-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function createField(labelText: string, input: HTMLElement, wide = false) {
  const label = document.createElement("label");
  if (wide) label.dataset.wide = "true";
  label.append(document.createTextNode(labelText), input);
  return label;
}

function createContextSection() {
  const root = document.createElement("section");
  root.setAttribute(CONTEXT_ROOT_ATTRIBUTE, "true");

  const title = document.createElement("p");
  title.className = "hc-external-context-title";
  title.textContent = "Relação com o HC";

  const grid = document.createElement("div");
  grid.className = "hc-external-context-grid";

  const studied = document.createElement("select");
  studied.name = "studiedAtHc";
  studied.innerHTML = '<option value="">Selecione</option><option value="yes">Sim</option><option value="no">Não</option>';

  const year = document.createElement("input");
  year.type = "number";
  year.name = "classYear";
  year.min = "1950";
  year.max = "2100";
  year.placeholder = "Ex.: 2006";

  const classGroup = document.createElement("input");
  classGroup.type = "text";
  classGroup.name = "classGroup";
  classGroup.maxLength = 40;
  classGroup.placeholder = "Ex.: A, B, C, D ou não lembro";

  const relationship = document.createElement("textarea");
  relationship.name = "relationshipToClass";
  relationship.maxLength = 240;
  relationship.placeholder = "Ex.: cônjuge de ex-aluno, amigo da turma, professor, familiar...";

  const studiedField = createField("Você estudou no HC?", studied, true);
  const yearField = createField("Em que ano você se formou?", year);
  const classField = createField("Qual era a sua sala?", classGroup);
  const relationshipField = createField("Qual a sua relação com a turma do HC de 2006?", relationship, true);

  yearField.dataset.hcContextConditional = "studied";
  classField.dataset.hcContextConditional = "studied";
  relationshipField.dataset.hcContextConditional = "not-studied";
  yearField.hidden = true;
  classField.hidden = true;
  relationshipField.hidden = true;

  const syncVisibility = () => {
    const value = studied.value;
    yearField.hidden = value !== "yes";
    classField.hidden = value !== "yes";
    relationshipField.hidden = value !== "no";
  };
  studied.addEventListener("change", syncVisibility);

  grid.append(studiedField, yearField, classField, relationshipField);
  root.append(title, grid);

  const pending = readPending();
  if (pending) {
    studied.value = pending.studiedAtHc ? "yes" : "no";
    year.value = pending.classYear ? String(pending.classYear) : "";
    classGroup.value = pending.classGroup ?? "";
    relationship.value = pending.relationshipToClass ?? "";
  }
  syncVisibility();

  return root;
}

function mountContextFields(form: HTMLElement) {
  if (form.querySelector(`[${CONTEXT_ROOT_ATTRIBUTE}]`)) return;
  const firstGrid = form.querySelector<HTMLElement>(".hc-external-grid");
  const context = createContextSection();
  if (firstGrid) firstGrid.insertAdjacentElement("afterend", context);
  else form.prepend(context);
}

function readContext(form: HTMLElement): { value: ExternalProfileContext | null; error: string | null } {
  const studiedValue = form.querySelector<HTMLSelectElement>('select[name="studiedAtHc"]')?.value ?? "";
  const yearRaw = form.querySelector<HTMLInputElement>('input[name="classYear"]')?.value.trim() ?? "";
  const classGroup = form.querySelector<HTMLInputElement>('input[name="classGroup"]')?.value.trim() ?? "";
  const relationship = form.querySelector<HTMLTextAreaElement>('textarea[name="relationshipToClass"]')?.value.trim() ?? "";

  if (!studiedValue) return { value: null, error: "Informe se você estudou no HC." };

  if (studiedValue === "yes") {
    const classYear = Number(yearRaw);
    if (!Number.isInteger(classYear) || classYear < 1950 || classYear > 2100) {
      return { value: null, error: "Informe o ano em que você se formou no HC." };
    }
    if (!classGroup) return { value: null, error: "Informe qual era a sua sala no HC." };

    return {
      value: {
        studiedAtHc: true,
        classYear,
        classGroup: classGroup.slice(0, 40),
        relationshipToClass: null,
      },
      error: null,
    };
  }

  if (!relationship) {
    return { value: null, error: "Informe qual é a sua relação com a turma do HC de 2006." };
  }

  return {
    value: {
      studiedAtHc: false,
      classYear: null,
      classGroup: null,
      relationshipToClass: relationship.slice(0, 240),
    },
    error: null,
  };
}

async function flushPendingContext() {
  if (flushInFlight) return;
  const pending = readPending();
  if (!pending) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  flushInFlight = true;
  try {
    const client = supabase as any;
    const profileQuery = await client
      .from("profiles")
      .select("id,people(person_type)")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileQuery.error || !profileQuery.data?.id) return;
    const person = Array.isArray(profileQuery.data.people) ? profileQuery.data.people[0] : profileQuery.data.people;
    if (person?.person_type !== "external") return;

    const payload = pending.studiedAtHc
      ? {
          studied_at_hc: true,
          class_year: pending.classYear,
          class_group: pending.classGroup,
          relationship_to_class: null,
        }
      : {
          studied_at_hc: false,
          class_year: null,
          class_group: null,
          relationship_to_class: pending.relationshipToClass,
        };

    const updateResult = await client
      .from("profiles")
      .update(payload)
      .eq("user_id", session.user.id)
      .select("id");

    if (!updateResult.error && Array.isArray(updateResult.data) && updateResult.data.length > 0) {
      clearPending();
    }
  } catch (error) {
    console.warn("[Usuário Externo] Não foi possível salvar o vínculo com o HC ainda.", error);
  } finally {
    flushInFlight = false;
  }
}

function handleSubmitCapture(event: MouseEvent) {
  const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(SUBMIT_SELECTOR) : null;
  const form = target?.closest<HTMLElement>(FORM_SELECTOR);
  if (!target || !form) return;

  const { value, error } = readContext(form);
  if (!value || error) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setExternalStatus(form, error || "Revise sua relação com o HC.", "error");
    return;
  }

  savePending(value);
  window.setTimeout(() => void flushPendingContext(), 900);
  window.setTimeout(() => void flushPendingContext(), 1800);
}

function applyEnhancements() {
  scheduled = false;
  injectStyles();
  document.querySelectorAll<HTMLElement>(FORM_SELECTOR).forEach(mountContextFields);
  void flushPendingContext();
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

export function installExternalUserProfileContextEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcExternalProfileContext === "true") return;
  document.documentElement.dataset.hcExternalProfileContext = "true";

  const start = () => {
    if (!document.body) return;
    document.addEventListener("click", handleSubmitCapture, true);
    observer?.disconnect();
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });
    supabase.auth.onAuthStateChange(() => window.setTimeout(() => void flushPendingContext(), 0));
    scheduleApply();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
