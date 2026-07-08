export {};

type RuntimePerson = {
  id: string;
  full_name: string;
  class_year: number;
  class_group: string | null;
  nickname_at_school: string | null;
};

let cachedPeople: RuntimePerson[] | null = null;
let cachedAdminRole: string | null | undefined;

function runtimeNavigate(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

async function runtimeModules() {
  const [supabaseModule, servicesModule] = await Promise.all([
    import("./supabase"),
    import("./services"),
  ]);
  return { supabase: supabaseModule.supabase, services: servicesModule };
}

async function getRuntimePeople() {
  if (cachedPeople) return cachedPeople;
  const { services } = await runtimeModules();
  cachedPeople = (await services.getPeople().catch(() => [])) as RuntimePerson[];
  return cachedPeople;
}

async function getCurrentRole() {
  if (cachedAdminRole !== undefined) return cachedAdminRole;
  const { supabase, services } = await runtimeModules();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    cachedAdminRole = null;
    return cachedAdminRole;
  }
  const adminUser = await services.getCurrentAdminUser(session.user.id).catch(() => null);
  cachedAdminRole = adminUser?.role ?? null;
  return cachedAdminRole;
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function addHeaderHomeButton() {
  const navs = Array.from(document.querySelectorAll<HTMLElement>("header nav"));
  for (const nav of navs) {
    if (nav.querySelector("[data-header-home-button='true']")) continue;
    const quemVai = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => normalizeText(button.textContent) === "quem vai");
    if (!quemVai) continue;

    const home = document.createElement("button");
    home.type = "button";
    home.dataset.headerHomeButton = "true";
    home.className = quemVai.className;
    home.textContent = "HOME";
    home.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      runtimeNavigate("/");
    };
    nav.insertBefore(home, quemVai);
  }
}

async function addSuperadminPanelButton() {
  const role = await getCurrentRole();
  if (role !== "superadmin") return;

  const existing = Array.from(document.querySelectorAll<HTMLElement>("[data-admin-panel-button='true']"));
  existing.forEach(button => { button.textContent = "PAINEL ADMIN"; });

  const dropdowns = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el => {
      const text = el.innerText || "";
      return text.includes("Editar perfil") && text.includes("Ver meus pedidos") && el.querySelector("button");
    });

  for (const dropdown of dropdowns) {
    if (dropdown.querySelector("[data-header-admin-panel-button='true']")) continue;
    const firstAction = Array.from(dropdown.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => normalizeText(button.textContent) === "editar perfil");
    if (!firstAction) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.headerAdminPanelButton = "true";
    button.dataset.adminPanelButton = "true";
    button.className = firstAction.className.replace("text-[#f0ebe0]", "text-[#c9a84c]");
    button.textContent = "PAINEL ADMIN";
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      runtimeNavigate("/admin");
    };
    firstAction.parentElement?.insertBefore(button, firstAction);
  }
}

function findHomeListSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section"))
    .find(section => /Quem j[aá].*lista|Quem vai|lista completa/i.test(section.innerText || ""));
}

async function replaceHomeNicknamesWithClass() {
  if (window.location.pathname !== "/") return;
  const section = findHomeListSection();
  if (!section || section.dataset.homeClassLabelsRuntime === "pending") return;
  section.dataset.homeClassLabelsRuntime = "pending";

  try {
    const people = await getRuntimePeople();
    const peopleByName = new Map(people.map(person => [normalizeText(person.full_name), person]));

    const nameParagraphs = Array.from(section.querySelectorAll<HTMLParagraphElement>("p"))
      .filter(p => peopleByName.has(normalizeText(p.textContent)));

    for (const nameEl of nameParagraphs) {
      const person = peopleByName.get(normalizeText(nameEl.textContent));
      if (!person) continue;

      const labelText = person.class_group
        ? `Turma ${person.class_group}`
        : `Turma ${person.class_year}`;

      const parent = nameEl.parentElement;
      if (!parent) continue;

      const paragraphs = Array.from(parent.querySelectorAll<HTMLParagraphElement>("p"));
      const label = paragraphs.find(p => p !== nameEl && /[“”"]|Turma|Sala/i.test(p.textContent || "")) ?? paragraphs[1] ?? document.createElement("p");
      label.textContent = labelText;
      label.className = "text-[#c9a84c] text-xs font-mono mt-0.5";
      if (!label.parentElement) nameEl.insertAdjacentElement("afterend", label);
    }
  } finally {
    delete section.dataset.homeClassLabelsRuntime;
  }
}

function removeHomeFullListButton() {
  if (window.location.pathname !== "/") return;
  const section = findHomeListSection();
  if (!section) return;
  Array.from(section.querySelectorAll<HTMLElement>("button, a"))
    .filter(el => normalizeText(el.textContent).includes("ver lista completa"))
    .forEach(el => {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    });
}

function runHeaderHomeListRuntime() {
  addHeaderHomeButton();
  addSuperadminPanelButton().catch(() => {});
  replaceHomeNicknamesWithClass().catch(() => {});
  removeHomeFullListButton();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    runHeaderHomeListRuntime();
    new MutationObserver(runHeaderHomeListRuntime).observe(document.body, { childList: true, subtree: true });
  });
}
