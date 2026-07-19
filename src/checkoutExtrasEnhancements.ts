const CHECKOUT_PATH = "/checkout";
const SOURCE_ATTRIBUTE = "data-checkout-extra-source";
const OPTIONS_ATTRIBUTE = "data-checkout-extra-options";
const OPTION_ATTRIBUTE = "data-checkout-extra-option";
const FAMILY_HELP_ATTRIBUTE = "data-checkout-family-children-help";
const FAMILY_BUTTON_ATTRIBUTE = "data-checkout-family-add-child";

let scheduled = false;

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

function findLabel(source: HTMLElement, type: "drinks" | "barbecue") {
  const expected = type === "drinks" ? "pacotes de bebidas" : "pacotes de churrasco";
  return Array.from(source.querySelectorAll<HTMLLabelElement>("label"))
    .find(label => normalize(label.textContent).includes(expected)) ?? null;
}

function inputFor(source: HTMLElement, type: "drinks" | "barbecue") {
  return findLabel(source, type)?.querySelector<HTMLInputElement>('input[type="number"]') ?? null;
}

function setNativeInputValue(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function syncOptions(options: HTMLElement, source: HTMLElement) {
  options.querySelectorAll<HTMLButtonElement>(`button[${OPTION_ATTRIBUTE}]`).forEach(button => {
    const type = button.getAttribute(OPTION_ATTRIBUTE) as "drinks" | "barbecue" | null;
    if (!type) return;
    const selected = Number(inputFor(source, type)?.value ?? 0) > 0;
    button.setAttribute("aria-pressed", String(selected));
  });
}

function createOptions(source: HTMLElement) {
  const options = document.createElement("div");
  options.setAttribute(OPTIONS_ATTRIBUTE, "true");

  const title = document.createElement("p");
  title.textContent = "Deseja comprar antecipadamente cervejas ou churrasquinhos?";
  title.setAttribute("data-checkout-extra-title", "true");
  options.appendChild(title);

  const buttons = document.createElement("div");
  buttons.setAttribute("data-checkout-extra-buttons", "true");

  ([
    ["drinks", "10 cervejas"],
    ["barbecue", "10 churrasquinhos"],
  ] as const).forEach(([type, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute(OPTION_ATTRIBUTE, type);
    button.setAttribute("aria-pressed", "false");
    buttons.appendChild(button);
  });

  options.appendChild(buttons);
  source.parentElement?.insertBefore(options, source);
  syncOptions(options, source);
}

function enhanceCheckoutExtras() {
  if (currentPath() !== CHECKOUT_PATH) {
    document.querySelectorAll<HTMLElement>(`[${OPTIONS_ATTRIBUTE}]`).forEach(element => element.remove());
    document.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`).forEach(element => element.removeAttribute(SOURCE_ATTRIBUTE));
    return;
  }

  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>("main label"));
  const sourceContainers = new Set<HTMLElement>();

  labels.forEach(label => {
    const text = normalize(label.textContent);
    if (!text.includes("pacotes de bebidas") && !text.includes("pacotes de churrasco")) return;
    const source = label.parentElement;
    if (source) sourceContainers.add(source);
  });

  sourceContainers.forEach(source => {
    if (!findLabel(source, "drinks") || !findLabel(source, "barbecue")) return;
    source.setAttribute(SOURCE_ATTRIBUTE, "true");

    const existing = source.previousElementSibling instanceof HTMLElement
      && source.previousElementSibling.hasAttribute(OPTIONS_ATTRIBUTE)
      ? source.previousElementSibling
      : null;

    if (existing) syncOptions(existing, source);
    else createOptions(source);
  });
}

function findAddChildButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("main button"))
    .find(button => {
      const text = normalize(button.textContent);
      return text === "adicionar filho(a)" || text === "adicionar filho adicional";
    }) ?? null;
}

function renameAddChildButton(button: HTMLButtonElement) {
  const textNode = Array.from(button.childNodes)
    .find(node => node.nodeType === Node.TEXT_NODE);

  if (textNode) {
    if (normalize(textNode.textContent) !== "adicionar filho adicional") {
      textNode.textContent = "Adicionar filho adicional";
    }
  } else if (!normalize(button.textContent).includes("adicionar filho adicional")) {
    button.appendChild(document.createTextNode("Adicionar filho adicional"));
  }
}

function createFamilyHelp(button: HTMLButtonElement) {
  const help = document.createElement("div");
  help.setAttribute(FAMILY_HELP_ATTRIBUTE, "true");

  const title = document.createElement("p");
  title.setAttribute("data-checkout-family-children-title", "true");
  title.textContent = "Filhos adicionais";

  const description = document.createElement("p");
  description.setAttribute("data-checkout-family-children-description", "true");
  description.textContent = "Inclua outros filhos que também participarão do reencontro.";

  help.append(title, description);
  button.parentElement?.insertBefore(help, button);
}

function enhanceFamilyChildrenOption() {
  if (currentPath() !== CHECKOUT_PATH) {
    document.querySelectorAll<HTMLElement>(`[${FAMILY_HELP_ATTRIBUTE}]`).forEach(element => element.remove());
    document.querySelectorAll<HTMLElement>(`[${FAMILY_BUTTON_ATTRIBUTE}]`).forEach(element => element.removeAttribute(FAMILY_BUTTON_ATTRIBUTE));
    return;
  }

  const button = findAddChildButton();
  const existingHelp = document.querySelector<HTMLElement>(`[${FAMILY_HELP_ATTRIBUTE}]`);

  if (!button) {
    existingHelp?.remove();
    return;
  }

  button.setAttribute(FAMILY_BUTTON_ATTRIBUTE, "true");
  renameAddChildButton(button);

  if (!existingHelp || existingHelp.nextElementSibling !== button) {
    existingHelp?.remove();
    createFamilyHelp(button);
  }
}

function handleOptionClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>(`button[${OPTION_ATTRIBUTE}]`);
  if (!button || currentPath() !== CHECKOUT_PATH) return;

  const options = button.closest<HTMLElement>(`[${OPTIONS_ATTRIBUTE}]`);
  const source = options?.nextElementSibling;
  if (!(source instanceof HTMLElement) || !source.hasAttribute(SOURCE_ATTRIBUTE)) return;

  const type = button.getAttribute(OPTION_ATTRIBUTE) as "drinks" | "barbecue" | null;
  if (!type) return;
  const input = inputFor(source, type);
  if (!input) return;

  const selected = Number(input.value) > 0;
  setNativeInputValue(input, selected ? 0 : 1);
  schedule();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    enhanceCheckoutExtras();
    enhanceFamilyChildrenOption();
  });
}

export function installCheckoutExtrasEnhancements() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  if ((window as any).__hcCheckoutExtrasEnhancementsInstalled) return;
  (window as any).__hcCheckoutExtrasEnhancementsInstalled = true;

  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleOptionClick, true);
    window.addEventListener("popstate", schedule);
    window.addEventListener("pushstate", schedule);
    schedule();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}