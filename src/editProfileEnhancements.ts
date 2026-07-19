import { getMyProfile, saveSchoolQuestionnaireAnswers } from "./lib/services";
import { supabase } from "./lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

const SCHOOL_PROFILE_QUESTIONS = [
  {
    id: "school_personality",
    title: "Como você era na época do HC?",
    options: [
      "Adorava me comunicar",
      "Fazia todo mundo rir",
      "Era mais na minha",
      "Gostava de estudar",
      "Vivia ajudando nos trabalhos",
      "Circulava por vários grupos",
      "Sempre tinha uma história boa",
      "Participava de tudo",
      "Era mais observador",
      "Vivia chegando atrasado",
      "Era parceria para qualquer coisa",
    ],
  },
  {
    id: "school_places",
    title: "Onde você mais aparecia?",
    options: [
      "No intervalo",
      "Na sala de aula",
      "Na quadra",
      "Nos corredores",
      "Nas gincanas",
      "Nos trabalhos em grupo",
      "Nas conversas depois da aula",
      "Nas festas da turma",
      "Nas aulas de revisão",
      "Na biblioteca ou estudando",
      "Em todo canto um pouco",
    ],
  },
  {
    id: "school_memories",
    title: "O que mais marcou essa época?",
    options: [
      "As amizades",
      "As resenhas no intervalo",
      "Os professores",
      "As histórias engraçadas",
      "As gincanas",
      "As festas",
      "As provas e simulados",
      "A pressão do vestibular",
      "Crescer junto com a turma",
      "Ver todo mundo quase todo dia",
      "A saudade de uma fase mais simples",
    ],
  },
  {
    id: "school_vibe",
    title: "Qual era sua vibe na turma?",
    options: [
      "Mais brincadeira",
      "Mais organização",
      "Mais tranquilidade",
      "Mais intensidade",
      "Mais discrição",
      "Mais parceria",
      "Mais competição",
      "Mais questionamento",
      "Mais sonhador",
      "Mais independente",
      "Um pouco de tudo",
    ],
  },
  {
    id: "reunion_expectation",
    title: "O que você quer viver no reencontro?",
    options: [
      "Rever quem fez parte da minha história",
      "Matar a saudade",
      "Dar boas risadas",
      "Relembrar histórias antigas",
      "Saber por onde anda todo mundo",
      "Celebrar os 20 anos da turma",
      "Reconectar com pessoas importantes",
      "Mostrar quem me tornei",
      "Viver uma noite leve",
      "Criar novas memórias",
      "Apenas aproveitar o momento",
    ],
  },
] as const;

type QuestionnaireAnswers = Record<string, string[]>;

type ProfileContext = {
  profileId: string;
  personId: string;
};

let scheduled = false;
let loadingPromise: Promise<void> | null = null;
let loadedProfileId: string | null = null;
let profileContext: ProfileContext | null = null;
let answers: QuestionnaireAnswers = {};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function findEditProfileRoot(): HTMLElement | null {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"))
    .find(element => normalize(element.textContent) === "editar meu perfil");
  if (!heading) return null;

  const constrainedRoot = heading.closest<HTMLElement>(".max-w-2xl");
  return constrainedRoot ?? heading.parentElement;
}

function findPhotoCard(root: HTMLElement): HTMLElement | null {
  const label = Array.from(root.querySelectorAll<HTMLElement>("p"))
    .find(element => normalize(element.textContent) === "foto de perfil");
  return label?.parentElement ?? null;
}

function hideBackButton(root: HTMLElement) {
  const backButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalize(button.textContent) === "minha área");
  if (!backButton) return;
  backButton.dataset.editProfileBackButton = "true";
  backButton.hidden = true;
}

function enhancePhotoCard(root: HTMLElement) {
  const card = findPhotoCard(root);
  if (!card) return;

  card.dataset.editProfilePhotoCard = "true";
  const title = Array.from(card.children).find((element): element is HTMLElement =>
    element instanceof HTMLElement && normalize(element.textContent) === "foto de perfil");
  const uploadRoot = title?.nextElementSibling instanceof HTMLElement ? title.nextElementSibling : null;
  const row = uploadRoot?.firstElementChild instanceof HTMLElement ? uploadRoot.firstElementChild : null;
  const photoBox = row?.firstElementChild instanceof HTMLElement ? row.firstElementChild : null;
  const controls = row?.children[1] instanceof HTMLElement ? row.children[1] as HTMLElement : null;

  if (uploadRoot) uploadRoot.dataset.editProfileAvatarRoot = "true";
  if (row) row.dataset.editProfileAvatarRow = "true";
  if (photoBox) photoBox.dataset.editProfileAvatarBox = "true";
  if (!controls) return;

  controls.dataset.editProfileAvatarControls = "true";

  const uploadLabel = Array.from(controls.querySelectorAll<HTMLLabelElement>("label"))
    .find(label => label.querySelector('input[type="file"]'));
  if (uploadLabel) uploadLabel.dataset.editProfileAvatarUpload = "true";

  const deleteButton = Array.from(controls.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => normalize(button.textContent) === "apagar foto");
  if (deleteButton) deleteButton.dataset.editProfileAvatarDelete = "true";

  const helper = Array.from(controls.querySelectorAll<HTMLParagraphElement>("p"))
    .find(paragraph => /jpg|png|webp/i.test(paragraph.textContent ?? ""));
  if (helper) {
    helper.dataset.editProfileAvatarHelper = "true";
    if (helper.textContent !== "Selecione fotos em JPG, PNG ou WebP até 10 MB.") {
      helper.textContent = "Selecione fotos em JPG, PNG ou WebP até 10 MB.";
    }
  }
}

function setStatus(section: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  const status = section.querySelector<HTMLElement>("[data-edit-profile-questionnaire-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function updateQuestionnaireButtons(section: HTMLElement) {
  section.querySelectorAll<HTMLButtonElement>("[data-question-id][data-option]").forEach(button => {
    const questionId = button.dataset.questionId ?? "";
    const option = button.dataset.option ?? "";
    const selected = (answers[questionId] ?? []).includes(option);
    button.dataset.selected = selected ? "true" : "false";
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function createQuestionnaireSection() {
  const section = document.createElement("section");
  section.dataset.editProfileQuestionnaire = "true";
  section.className = "edit-profile-questionnaire";

  const header = document.createElement("div");
  header.className = "edit-profile-questionnaire-header";

  const eyebrow = document.createElement("p");
  eyebrow.className = "edit-profile-questionnaire-eyebrow";
  eyebrow.textContent = "Tempos de escola";

  const title = document.createElement("h2");
  title.className = "edit-profile-questionnaire-title";
  title.textContent = "Perguntas do cadastro";

  const description = document.createElement("p");
  description.className = "edit-profile-questionnaire-description";
  description.textContent = "Atualize as respostas usadas nos dados e curiosidades da turma. Você pode selecionar várias opções em cada pergunta.";

  header.append(eyebrow, title, description);
  section.appendChild(header);

  const questions = document.createElement("div");
  questions.className = "edit-profile-questionnaire-list";

  SCHOOL_PROFILE_QUESTIONS.forEach((question, questionIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "edit-profile-questionnaire-question";

    const legend = document.createElement("legend");
    legend.className = "edit-profile-questionnaire-legend";
    legend.textContent = `${questionIndex + 1}. ${question.title}`;

    const options = document.createElement("div");
    options.className = "edit-profile-questionnaire-options";

    question.options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "edit-profile-questionnaire-option";
      button.dataset.questionId = question.id;
      button.dataset.option = option;
      button.textContent = option;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const current = answers[question.id] ?? [];
        answers = {
          ...answers,
          [question.id]: current.includes(option)
            ? current.filter(item => item !== option)
            : [...current, option],
        };
        updateQuestionnaireButtons(section);
        setStatus(section, "Há alterações ainda não salvas.");
      });
      options.appendChild(button);
    });

    fieldset.append(legend, options);
    questions.appendChild(fieldset);
  });

  section.appendChild(questions);

  const footer = document.createElement("div");
  footer.className = "edit-profile-questionnaire-footer";

  const status = document.createElement("p");
  status.dataset.editProfileQuestionnaireStatus = "true";
  status.className = "edit-profile-questionnaire-status";
  status.dataset.tone = "muted";
  status.textContent = "Carregando suas respostas...";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "edit-profile-questionnaire-save";
  saveButton.textContent = "Salvar respostas";
  saveButton.addEventListener("click", async () => {
    if (!profileContext) {
      setStatus(section, "Não foi possível identificar o perfil vinculado à sua conta.", "error");
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Salvando...";
    setStatus(section, "Salvando respostas...");

    try {
      const emptyQuestionIds = SCHOOL_PROFILE_QUESTIONS
        .filter(question => !(answers[question.id] ?? []).length)
        .map(question => question.id);

      if (emptyQuestionIds.length) {
        const { error: deleteError } = await (supabase as any)
          .from("profile_school_questionnaire_answers")
          .delete()
          .eq("profile_id", profileContext.profileId)
          .in("question_id", emptyQuestionIds);
        if (deleteError) throw deleteError;
      }

      await saveSchoolQuestionnaireAnswers({
        eventId: DEFAULT_EVENT_ID,
        profileId: profileContext.profileId,
        personId: profileContext.personId,
        answers,
      });

      setStatus(section, "Respostas salvas com sucesso.", "success");
    } catch (error) {
      setStatus(section, error instanceof Error ? error.message : "Não foi possível salvar as respostas.", "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Salvar respostas";
    }
  });

  footer.append(status, saveButton);
  section.appendChild(footer);
  return section;
}

function mountQuestionnaire(root: HTMLElement) {
  const photoCard = findPhotoCard(root);
  const stack = photoCard?.parentElement;
  if (!photoCard || !stack) return null;

  let section = stack.querySelector<HTMLElement>("[data-edit-profile-questionnaire]");
  if (!section) {
    section = createQuestionnaireSection();
    const personalInfoCard = photoCard.nextElementSibling;
    if (personalInfoCard) personalInfoCard.after(section);
    else stack.appendChild(section);
  }
  return section;
}

async function loadQuestionnaire(section: HTMLElement) {
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Faça login novamente para editar as respostas.");

      const profile = await getMyProfile(userId);
      if (!profile?.id || !profile.person_id) {
        throw new Error("Perfil ainda não vinculado à sua conta.");
      }

      profileContext = { profileId: profile.id, personId: profile.person_id };
      if (loadedProfileId !== profile.id) {
        const { data, error } = await (supabase as any)
          .from("profile_school_questionnaire_answers")
          .select("question_id,selected_options_json")
          .eq("profile_id", profile.id);
        if (error) throw error;

        answers = Object.fromEntries(
          SCHOOL_PROFILE_QUESTIONS.map(question => [
            question.id,
            ((data ?? []).find((row: any) => row.question_id === question.id)?.selected_options_json ?? []) as string[],
          ]),
        );
        loadedProfileId = profile.id;
      }

      updateQuestionnaireButtons(section);
      setStatus(
        section,
        Object.values(answers).some(options => options.length)
          ? "Respostas atuais carregadas."
          : "Você ainda não respondeu a estas perguntas.",
      );
    } catch (error) {
      setStatus(section, error instanceof Error ? error.message : "Não foi possível carregar as respostas.", "error");
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

function applyEnhancements() {
  const root = findEditProfileRoot();
  if (!root) return;

  root.dataset.editProfileEnhanced = "true";
  hideBackButton(root);
  enhancePhotoCard(root);
  const questionnaire = mountQuestionnaire(root);
  if (questionnaire) void loadQuestionnaire(questionnaire);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyEnhancements();
  });
}

export function installEditProfileEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcEditProfileEnhancementsInstalled) return;
  (window as any).__hcEditProfileEnhancementsInstalled = true;

  const start = () => {
    scheduleApply();
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleApply);
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
