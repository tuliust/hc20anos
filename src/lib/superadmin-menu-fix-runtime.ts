export {};

function goAdminPanel() {
  window.history.pushState({}, "", "/admin");
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

function cleanText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function isCurrentUserSuperadmin() {
  const [{ supabase }, services] = await Promise.all([
    import("./supabase"),
    import("./services"),
  ]);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;
  const adminUser = await services.getCurrentAdminUser(session.user.id).catch(() => null);
  return adminUser?.role === "superadmin";
}

function addButtonToDropdown() {
  const dropdowns = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el => {
      const text = cleanText(el.innerText);
      return text.includes("editar perfil") && text.includes("ver meus pedidos") && Boolean(el.querySelector("button"));
    });

  for (const dropdown of dropdowns) {
    const previous = dropdown.querySelector<HTMLElement>("[data-superadmin-menu-fixed='true']");
    if (previous) {
      previous.textContent = "PAINEL ADMIN";
      continue;
    }

    const editButton = Array.from(dropdown.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => cleanText(button.textContent) === "editar perfil");
    if (!editButton) continue;

    const panelButton = document.createElement("button");
    panelButton.type = "button";
    panelButton.dataset.superadminMenuFixed = "true";
    panelButton.dataset.adminPanelButton = "true";
    panelButton.className = editButton.className.replace("text-[#f0ebe0]", "text-[#c9a84c]");
    panelButton.textContent = "PAINEL ADMIN";
    panelButton.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      goAdminPanel();
    };

    editButton.parentElement?.insertBefore(panelButton, editButton);
  }
}

async function runSuperadminMenuFix() {
  if (!(await isCurrentUserSuperadmin())) return;
  document.querySelectorAll<HTMLElement>("[data-admin-panel-button='true']")
    .forEach(button => { button.textContent = "PAINEL ADMIN"; });
  addButtonToDropdown();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    runSuperadminMenuFix().catch(() => {});
    new MutationObserver(() => runSuperadminMenuFix().catch(() => {}))
      .observe(document.body, { childList: true, subtree: true });
  });

  import("./supabase").then(({ supabase }) => {
    supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => runSuperadminMenuFix().catch(() => {}), 150);
    });
  }).catch(() => {});
}
