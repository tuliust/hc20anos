import { generateProfileBio } from "./lib/profileBioAi";
import { getMyProfile, saveMyPublicProfile } from "./lib/services";
import { supabase } from "./lib/supabase";

const EDIT_PROFILE_PATHS = new Set(["/editar-perfil", "/edit-profile"]);
const QUESTIONNAIRE_SELECTOR = "[data-edit-profile-questionnaire]";
const REGENERATE_BUTTON_ATTRIBUTE = "data-edit-profile-regenerate-bio";
const ACTIONS_ATTRIBUTE = "data-edit-profile-questionnaire-actions";
const LEGACY_MEMORY_ATTRIBUTE = "data-edit-profile-legacy-memory-field";
const BIO_FIELD_ATTRIBUTE = "data-edit-profile-bio-field";

type MyProfile = Awaited<ReturnType<typeof getMyProfile>>;

let scheduled = false;
let observer: MutationObserver | null = null;
let profilePromise: Promise<MyProfile> | null = null;
let profileSnapshot: MyProfile = null;
let currentUserId: string | null = null;
let requestVersion = 0;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isEditProfilePage() {
  if (EDIT_PROFILE_PATHS.has(currentPath())) return true;
  return Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"))
    .some(element => normalize(element.textContent) === "editar meu perfil");
}

function findEditProfileRoot() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"))
    .find(element => normalize(element.textContent) === "editar meu perfil");
  return heading?.closest<HTMLElement>(".max-w-2xl") ?? heading?.parentElement ?? null;
}

function findFieldContainer(root: HTMLElement, labelText: string) {
  const label = Array.from(root.querySelectorAll<HTMLElement>("label,p"))
    .find(element => normalize(element.textContent) === normalize(labelText));
  if (!label) return null;

  let candidate: HTMLElement | null = label.parentElement;
  for (let depth = 0; candidate && depth < 4; depth += 1) {
    if (candidate.querySelector("textarea")) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

function setControlledTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, value);
  else textarea.value = value;

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function removeLegacyDraftFields(userId: string) {
  const draftKey = `edit-profile-draft-${userId}`;
  try {
    const raw = window.sessionStorage.getItem(draftKey);
    if (!raw) return;

    const parsed = JSON.parse(raw) as { form?: Record<string, unknown>; privacy?: Record<string, unknown> };
    if (!parsed.form || typeof parsed.form !== "object") return;

    delete parsed.form.bio;
    delete parsed.form.memoryText;
    window.sessionStorage.setItem(draftKey, JSON.stringify(parsed));
  } catch {
    window.sessionStorage.removeItem(draftKey);
  }
}

function hideLegacyMemoryField(root: HTMLElement) {
  const container = findFieldContainer(root, "Memória favorita do HC");
  if (!container) return;

  container.setAttribute(LEGACY_MEMORY_ATTRIBUTE, "true");
  container.hidden = true;
  container.setAttribute("aria-hidden", "true");
}

function syncBioField(root: HTMLElement, profile: NonNullable<MyProfile>, force = false) {
  const container = findFieldContainer(root, "Mini bio");
  const textarea = container?.querySelector<HTMLTextAreaElement>("textarea");
  if (!container || !textarea) return;

  container.setAttribute(BIO_FIELD_ATTRIBUTE, "true");
  const expectedMarker = `${profile.id}:${profile.bio ?? ""}`;
  if (!force && textarea.dataset.editProfileBioSync === expectedMarker) return;

  const profileBio = profile.bio ?? "";
  if (textarea.value !== profileBio) setControlledTextareaValue(textarea, profileBio);
  textarea.dataset.editProfileBioSync = expectedMarker;
}

function questionnaireStatus(section: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  const status = section.querySelector<HTMLElement>("[data-edit-profile-questionnaire-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function collectQuestionnaireAnswers(section: HTMLElement) {
  return Array.from(section.querySelectorAll<HTMLFieldSetElement>("fieldset"))
    .map(fieldset => {
      const optionButtons = Array.from(fieldset.querySelectorAll<HTMLButtonElement>("[data-question-id][data-option]"));
      const id = optionButtons[0]?.dataset.questionId ?? "";
      const rawQuestion = fieldset.querySelector("legend")?.textContent ?? "";
      const question = rawQuestion.replace(/^\s*\d+\.\s*/, "").trim();
      const options = optionButtons
        .filter(button => button.dataset.selected === "true" || button.getAttribute("aria-pressed") === "true")
        .map(button => button.dataset.option ?? "")
        .filter(Boolean);

      return { id, question, options };
    })
    .filter(answer => answer.id && answer.question);
}

async function loadCurrentProfile() {
  if (profilePromise) return profilePromise;
  const version = ++requestVersion;

  profilePromise = (async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user?.id) throw new Error("Faça login novamente para editar seu perfil.");

    const profile = await getMyProfile(user.id);
    if (version !== requestVersion) return profileSnapshot;

    currentUserId = user.id;
    profileSnapshot = profile;
    removeLegacyDraftFields(user.id);
    return profile;
  })().finally(() => {
    profilePromise = null;
  });

  return profilePromise;
}

async function regenerateProfileBio(section: HTMLElement, button: HTMLButtonElement) {
  const root = findEditProfileRoot();
  if (!root) return;

  const previousLabel = button.textContent || "Gerar novamente a descrição do perfil";
  button.disabled = true;
  button.textContent = "Gerando descrição...";
  questionnaireStatus(section, "Gerando uma nova descrição do perfil...");

  try {
    const profile = profileSnapshot ?? await loadCurrentProfile();
    if (!profile?.id || !profile.person_id || !currentUserId) {
      throw new Error("Não foi possível identificar o perfil vinculado à sua conta.");
    }

    const questionnaire = collectQuestionnaireAnswers(section);
    if (!questionnaire.some(answer => answer.options.length > 0)) {
      throw new Error("Selecione pelo menos uma resposta antes de gerar a descrição do perfil.");
    }

    const generatedBio = await generateProfileBio({
      name: (profile.display_name || profile.people?.full_name || "Ex-aluno").trim(),
      nickname: profile.people?.nickname_at_school?.trim() || undefined,
      city: profile.current_city?.trim() || undefined,
      profession: profile.profession?.trim() || undefined,
      relationshipStatus: profile.relationship_status ?? undefined,
      hasChildren: typeof profile.has_children === "boolean" ? profile.has_children : undefined,
      childrenCount: profile.has_children && typeof profile.children_count === "number"
        ? profile.children_count
        : undefined,
      answers: questionnaire,
    });

    const updated = await saveMyPublicProfile(currentUserId, { bio: generatedBio });
    profileSnapshot = { ...profile, ...updated };
    syncBioField(root, profileSnapshot, true);
    questionnaireStatus(section, "Descrição do perfil gerada e salva com sucesso.", "success");
  } catch (error) {
    questionnaireStatus(
      section,
      error instanceof Error ? error.message : "Não foi possível gerar novamente a descrição do perfil.",
      "error",
    );
  } finally {
    button.disabled = false;
    button.textContent = previousLabel;
  }
}

function ensureRegenerateButton(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>(QUESTIONNAIRE_SELECTOR);
  const footer = section?.querySelector<HTMLElement>(".edit-profile-questionnaire-footer");
  if (!section || !footer) return;

  let actions = footer.querySelector<HTMLElement>(`[${ACTIONS_ATTRIBUTE}]`);
  if (!actions) {
    actions = document.createElement("div");
    actions.setAttribute(ACTIONS_ATTRIBUTE, "true");
    actions.className = "edit-profile-questionnaire-actions";

    const saveButton = footer.querySelector<HTMLButtonElement>(".edit-profile-questionnaire-save");
    footer.appendChild(actions);
    if (saveButton) actions.appendChild(saveButton);
  }

  if (actions.querySelector(`[${REGENERATE_BUTTON_ATTRIBUTE}]`)) return;

  const regenerateButton = document.createElement("button");
  regenerateButton.type = "button";
  regenerateButton.setAttribute(REGENERATE_BUTTON_ATTRIBUTE, "true");
  regenerateButton.className = "edit-profile-questionnaire-regenerate";
  regenerateButton.textContent = "Gerar novamente a descrição do perfil";
  regenerateButton.addEventListener("click", () => void regenerateProfileBio(section, regenerateButton));
  actions.appendChild(regenerateButton);
}

async function applyAsyncEnhancements(root: HTMLElement) {
  try {
    const profile = await loadCurrentProfile();
    if (profile) syncBioField(root, profile);
  } catch (error) {
    console.warn("[Editar perfil] Não foi possível sincronizar a mini bio.", error);
  }
}

function applyEnhancements() {
  scheduled = false;
  if (!isEditProfilePage()) return;

  const root = findEditProfileRoot();
  if (!root) return;

  root.dataset.editProfileQuestionnaireBioEnhanced = "true";
  hideLegacyMemoryField(root);
  ensureRegenerateButton(root);
  void applyAsyncEnhancements(root);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyEnhancements);
}

function refreshForNavigation() {
  requestVersion += 1;
  profilePromise = null;
  profileSnapshot = null;
  currentUserId = null;
  scheduleApply();
}

export function installEditProfileQuestionnaireBioEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcEditProfileQuestionnaireBio === "true") return;
  document.documentElement.dataset.hcEditProfileQuestionnaireBio = "true";

  const start = () => {
    if (!document.body) return;
    observer?.disconnect();
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("popstate", refreshForNavigation);
    window.addEventListener("pushstate", refreshForNavigation as EventListener);
    supabase.auth.onAuthStateChange(() => window.setTimeout(refreshForNavigation, 0));
    scheduleApply();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
