const ENHANCED = "data-hc-password-visibility";
const BUTTON_ATTRIBUTE = "data-hc-password-toggle";
const STYLE_ID = "hc-password-visibility-style";

let frameId: number | null = null;
let observer: MutationObserver | null = null;

function eyeIcon(visible: boolean) {
  if (visible) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 6 9 8a10.8 10.8 0 01-2.1 3.3M6.2 6.2C4.1 7.7 3 10.2 3 12c0 2 3.5 8 9 8 1.4 0 2.7-.4 3.8-1"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${BUTTON_ATTRIBUTE}] {
      position: absolute;
      z-index: 8;
      width: 2.5rem;
      height: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: .35rem;
      background: transparent;
      color: #8ab89a;
      cursor: pointer;
      padding: .55rem;
      transform: translateY(-50%);
    }
    [${BUTTON_ATTRIBUTE}]:hover { color: #c9a84c; background: rgba(201,168,76,.08); }
    [${BUTTON_ATTRIBUTE}]:focus-visible { outline: 2px solid #c9a84c; outline-offset: 1px; }
    [${BUTTON_ATTRIBUTE}] svg { width: 1.15rem; height: 1.15rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    input[${ENHANCED}="true"] { padding-right: 3rem !important; }
  `;
  document.head.appendChild(style);
}

function positionToggle(input: HTMLInputElement, button: HTMLButtonElement) {
  const parent = input.parentElement;
  if (!(parent instanceof HTMLElement)) return;

  const computed = window.getComputedStyle(parent);
  if (computed.position === "static") parent.style.position = "relative";

  button.style.right = `${Math.max(6, parent.clientWidth - input.offsetLeft - input.offsetWidth + 6)}px`;
  button.style.top = `${input.offsetTop + input.offsetHeight / 2}px`;
}

function enhanceInput(input: HTMLInputElement) {
  if (input.getAttribute(ENHANCED) === "true") return;
  const parent = input.parentElement;
  if (!(parent instanceof HTMLElement)) return;

  input.setAttribute(ENHANCED, "true");

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute(BUTTON_ATTRIBUTE, "true");
  button.setAttribute("aria-label", "Mostrar senha");
  button.setAttribute("aria-pressed", "false");
  button.title = "Mostrar senha";
  button.innerHTML = eyeIcon(false);

  button.addEventListener("click", () => {
    const shouldShow = input.type === "password";
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    input.type = shouldShow ? "text" : "password";
    button.setAttribute("aria-pressed", String(shouldShow));
    button.setAttribute("aria-label", shouldShow ? "Ocultar senha" : "Mostrar senha");
    button.title = shouldShow ? "Ocultar senha" : "Mostrar senha";
    button.innerHTML = eyeIcon(shouldShow);

    input.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) {
      try { input.setSelectionRange(selectionStart, selectionEnd); } catch { /* unsupported input type */ }
    }
    positionToggle(input, button);
  });

  input.insertAdjacentElement("afterend", button);
  positionToggle(input, button);
}

function apply() {
  frameId = null;
  injectStyles();

  document.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-hc-password-visibility="true"]')
    .forEach(input => {
      if (input.type !== "password" && input.getAttribute(ENHANCED) !== "true") return;
      enhanceInput(input);
      const button = input.parentElement?.querySelector<HTMLButtonElement>(`[${BUTTON_ATTRIBUTE}]`);
      if (button) positionToggle(input, button);
    });
}

function schedule() {
  if (frameId !== null) return;
  frameId = window.requestAnimationFrame(apply);
}

export function installPasswordVisibilityEnhancement() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcPasswordVisibility === "true") return;
  document.documentElement.dataset.hcPasswordVisibility = "true";

  const start = () => {
    if (!document.body) return;
    observer?.disconnect();
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["type"] });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
