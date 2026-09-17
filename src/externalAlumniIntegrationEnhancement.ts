const FORM_SELECTOR = "[data-hc-external-user-form]";
const CONTEXT_SELECTOR = "[data-hc-external-profile-context]";

let scheduled = false;

function applyCopy() {
  scheduled = false;

  document.querySelectorAll<HTMLElement>(FORM_SELECTOR).forEach(form => {
    const intro = form.querySelector<HTMLElement>(".hc-external-intro");
    if (intro) {
      intro.textContent = "Se seu nome não estiver na lista da Turma 2006, crie um acesso para continuar. Se você informar que estudou no HC e se formou em 2006, seu cadastro será integrado à lista da turma com nome, avatar e perfil.";
    }

    const context = form.querySelector<HTMLElement>(CONTEXT_SELECTOR);
    if (context && !context.querySelector('[data-hc-alumni-integration-note="true"]')) {
      const note = document.createElement("p");
      note.dataset.hcAlumniIntegrationNote = "true";
      note.textContent = "Formandos do HC em 2006 passam automaticamente a integrar a lista pública da turma. Os demais cadastros continuam como Usuário Externo.";
      note.style.margin = ".8rem 0 0";
      note.style.color = "#8ab89a";
      note.style.fontSize = ".78rem";
      note.style.lineHeight = "1.5";
      context.appendChild(note);
    }
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyCopy);
}

export function installExternalAlumniIntegrationEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcExternalAlumniIntegration === "true") return;
  document.documentElement.dataset.hcExternalAlumniIntegration = "true";

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
