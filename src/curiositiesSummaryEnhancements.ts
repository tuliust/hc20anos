import { supabase } from "./lib/supabase";

const REMOVED_LABELS = new Set([
  "cadastrados",
  "pre-confirmados",
  "confirmados",
  "com filhos",
]);

const RENAMED_LABELS: Record<string, string> = {
  "pre-cadastrados": "Ex-alunos 2006",
  "cidades": "Cidades onde estão hoje",
  "filhos declarados": "Total de filhos dos ex-alunos",
};

const CHART_TITLE_RENAMES: Record<string, string> = {
  "relacionamentos": "Solteiros e Casados",
  "filhos": "Quem já tem filho",
  "profissoes por area": "Em que área estamos atuando",
};

const REMOVED_CHART_DESCRIPTIONS = new Set([
  "distribuicao agregada dos perfis cadastrados.",
  "dados declarados no cadastro, exibidos somente de forma agregada.",
  "agrupamento aproximado das profissoes informadas publicamente.",
]);

let scheduled = false;
let questionnaireCtaVisible: boolean | null = null;
let questionnaireStatusRequest = 0;

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isCuriositiesPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/curiosidades" || path === "/curiosities") return true;

  return Array.from(document.querySelectorAll<HTMLElement>("h1,h2"))
    .some(element => normalizeText(element.textContent).includes("raio-x da turma 2006"));
}

function cardLabelElement(card: HTMLElement) {
  return Array.from(card.querySelectorAll<HTMLElement>("p"))
    .find(element => {
      const text = normalizeText(element.textContent);
      return REMOVED_LABELS.has(text)
        || Object.prototype.hasOwnProperty.call(RENAMED_LABELS, text)
        || text === "areas profissionais"
        || text === "ex-alunos 2006"
        || text === "cidades onde estao hoje"
        || text === "total de filhos dos ex-alunos";
    }) ?? null;
}

function findSummaryGrid() {
  const candidateLabel = Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .find(element => {
      const text = normalizeText(element.textContent);
      return text === "pre-cadastrados"
        || text === "ex-alunos 2006"
        || text === "cidades"
        || text === "cidades onde estao hoje";
    });

  const card = candidateLabel?.parentElement?.parentElement;
  const grid = card?.parentElement;
  if (!(grid instanceof HTMLElement)) return null;

  const directCards = Array.from(grid.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement);
  const recognizedCards = directCards.filter(child => cardLabelElement(child));

  return recognizedCards.length >= 4 ? grid : null;
}

function applySummaryChanges() {
  const grid = findSummaryGrid();
  if (!grid) return;

  const cards = Array.from(grid.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement);

  cards.forEach(card => {
    const labelElement = cardLabelElement(card);
    if (!labelElement) return;

    const normalizedLabel = normalizeText(labelElement.textContent);

    if (REMOVED_LABELS.has(normalizedLabel)) {
      card.remove();
      return;
    }

    const renamedLabel = RENAMED_LABELS[normalizedLabel];
    if (renamedLabel) labelElement.textContent = renamedLabel;

    if (normalizedLabel === "cidades" || normalizedLabel === "cidades onde estao hoje") {
      Array.from(card.querySelectorAll<HTMLElement>("p"))
        .find(element => normalizeText(element.textContent) === "com exibicao autorizada")
        ?.remove();
    }
  });

  grid.dataset.curiositiesSummaryAdjusted = "true";
}

function applyChartContentChanges() {
  Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .filter(element => normalizeText(element.textContent) === "infografico")
    .forEach(element => element.remove());

  Array.from(document.querySelectorAll<HTMLElement>("main h3"))
    .forEach(title => {
      const replacement = CHART_TITLE_RENAMES[normalizeText(title.textContent)];
      if (replacement) title.textContent = replacement;
    });

  Array.from(document.querySelectorAll<HTMLElement>("main p"))
    .filter(element => REMOVED_CHART_DESCRIPTIONS.has(normalizeText(element.textContent)))
    .forEach(element => element.remove());
}

function findQuestionnaireButton() {
  const sectionTitle = Array.from(document.querySelectorAll<HTMLElement>("main h2"))
    .find(element => normalizeText(element.textContent) === "o que a turma contou no cadastro");
  const section = sectionTitle?.closest("section");
  if (!section) return null;

  return Array.from(section.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => {
      const text = normalizeText(button.textContent);
      return text.includes("responder questionario") || text.includes("ja respondeu as perguntas");
    }) ?? null;
}

function replaceButtonLabel(button: HTMLButtonElement, label: string) {
  const textNodes = Array.from(button.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));

  if (textNodes.length > 0) {
    textNodes[textNodes.length - 1].textContent = label;
    return;
  }

  const textualChild = Array.from(button.children)
    .find((child): child is HTMLElement => child instanceof HTMLElement && !child.matches("svg"));

  if (textualChild) {
    textualChild.textContent = label;
    return;
  }

  button.append(document.createTextNode(label));
}

function applyQuestionnaireCta() {
  const button = findQuestionnaireButton();
  if (!button) return;

  replaceButtonLabel(button, "Já respondeu as perguntas?");

  const shouldShow = questionnaireCtaVisible !== false;
  button.hidden = !shouldShow;
  button.style.display = shouldShow ? "" : "none";
  button.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  button.dataset.questionnaireEligibility = questionnaireCtaVisible === null
    ? "loading"
    : shouldShow ? "eligible" : "answered";
}

async function refreshQuestionnaireEligibility() {
  const requestId = questionnaireStatusRequest + 1;
  questionnaireStatusRequest = requestId;
  questionnaireCtaVisible = null;
  scheduleApply();

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (requestId !== questionnaireStatusRequest) return;

    const userId = session?.user?.id;
    if (!userId) {
      questionnaireCtaVisible = true;
      scheduleApply();
      return;
    }

    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (requestId !== questionnaireStatusRequest) return;

    if (!profile?.id) {
      questionnaireCtaVisible = true;
      scheduleApply();
      return;
    }

    const { data: answers, error: answersError } = await (supabase as any)
      .from("profile_school_questionnaire_answers")
      .select("question_id")
      .eq("profile_id", profile.id)
      .limit(1);
    if (answersError) throw answersError;
    if (requestId !== questionnaireStatusRequest) return;

    questionnaireCtaVisible = !Array.isArray(answers) || answers.length === 0;
  } catch (error) {
    console.warn("Não foi possível verificar as respostas do questionário.", error);
    if (requestId === questionnaireStatusRequest) questionnaireCtaVisible = true;
  }

  scheduleApply();
}

function applyCuriositiesChanges() {
  if (!isCuriositiesPage()) return;
  applySummaryChanges();
  applyChartContentChanges();
  applyQuestionnaireCta();
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyCuriositiesChanges();
  });
}

function refreshForNavigation() {
  scheduleApply();
  if (isCuriositiesPage()) void refreshQuestionnaireEligibility();
}

export function installCuriositiesSummaryEnhancements() {
  if ((window as any).__hcCuriositiesSummaryEnhancementsInstalled) return;
  (window as any).__hcCuriositiesSummaryEnhancementsInstalled = true;

  scheduleApply();
  void refreshQuestionnaireEligibility();

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(scheduleApply).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) startObserver();
  else window.addEventListener("DOMContentLoaded", startObserver, { once: true });

  window.addEventListener("popstate", refreshForNavigation);
  window.addEventListener("pushstate", refreshForNavigation);

  supabase.auth.onAuthStateChange(() => {
    window.setTimeout(() => {
      void refreshQuestionnaireEligibility();
    }, 0);
  });
}