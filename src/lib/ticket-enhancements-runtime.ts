// Runtime enhancements kept intentionally dependency-light so production builds do not fail
// when experimental UI consolidation changes are adjusted.

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const SUPABASE_PUBLIC_BASE = "https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/photos";
const HOME_PREVIEW_URLS = [1, 2, 3, 4, 5, 6].map((i) => `${SUPABASE_PUBLIC_BASE}/home-preview/galera${i}.jpg`);

function navigateTo(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function findSectionByText(pattern: RegExp) {
  return Array.from(document.querySelectorAll("section")).find((section) => pattern.test((section as HTMLElement).innerText || "")) as HTMLElement | undefined;
}

function pageRoot() {
  const main = document.querySelector("main");
  return main?.firstElementChild instanceof HTMLElement ? main.firstElementChild : main;
}

function consolidateRoutes() {
  const path = window.location.pathname;
  if (path.includes("/mapa")) navigateTo("/turma");
  if (path.includes("/memorias") || path.includes("/enquetes")) navigateTo("/fotos");
}

function cleanupNavigation() {
  const items = Array.from(document.querySelectorAll("button, a")) as HTMLElement[];
  for (const item of items) {
    const text = (item.textContent || "").trim().toLowerCase();
    if (text === "a turma") item.textContent = "Ex-alunos";
    if (text === "acervo") item.textContent = "Pós-festa";
    if (["mapa", "memórias", "enquetes"].includes(text)) {
      item.style.display = "none";
      item.setAttribute("aria-hidden", "true");
    }
  }
}

async function getSupabaseAndServices() {
  const [supabaseModule, servicesModule] = await Promise.all([
    import("./supabase"),
    import("./services"),
  ]);
  return { supabase: supabaseModule.supabase, services: servicesModule };
}

function overrideHomePreviewPhotos() {
  const section = findSectionByText(/Fotos fictícias|fotos ficticias|fotos antigas|época/i);
  if (!section || section.dataset.homePreviewPhotos === "done") return;

  const images = Array.from(section.querySelectorAll("img")).slice(0, 6) as HTMLImageElement[];
  if (!images.length) return;

  images.forEach((img, index) => {
    img.src = HOME_PREVIEW_URLS[index];
    img.removeAttribute("srcset");
    img.alt = `Foto da turma ${index + 1}`;
  });

  section.dataset.homePreviewPhotos = "done";
}

function openMemoryModal() {
  if (document.querySelector("[data-memory-modal='true']")) return;

  const modal = document.createElement("div");
  modal.dataset.memoryModal = "true";
  modal.className = "fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="bg-[#080f08] border border-[#2d6a4f]/40 w-full max-w-xl p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-2">Memórias da turma</p>
          <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">Adicionar memória</h3>
        </div>
        <button data-close-memory-modal class="text-[#7a9a7a] hover:text-[#f0ebe0] text-2xl leading-none">×</button>
      </div>
      <textarea data-memory-text rows="6" maxlength="420" placeholder="Conte uma lembrança do HC, da turma, dos professores ou de algum momento que ficou marcado..." class="w-full bg-[#141f14] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a5a3a] p-4 text-sm focus:outline-none focus:border-[#2d6a4f]"></textarea>
      <label class="flex items-center gap-3 mt-4 text-[#7a9a7a] text-sm cursor-pointer">
        <input data-memory-anonymous type="checkbox" class="w-4 h-4 accent-[#2d6a4f]" /> Enviar sem mostrar meu nome
      </label>
      <p data-memory-status class="text-[#7a9a7a] text-xs font-mono mt-4"></p>
      <div class="flex flex-col sm:flex-row gap-3 mt-6">
        <button data-submit-memory class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#40916c]">Enviar para moderação</button>
        <button data-close-memory-modal class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] hover:text-[#f0ebe0]">Cancelar</button>
      </div>
    </div>
  `;

  modal.querySelectorAll("[data-close-memory-modal]").forEach((button) => {
    (button as HTMLElement).onclick = () => modal.remove();
  });

  const submitButton = modal.querySelector("[data-submit-memory]") as HTMLButtonElement | null;
  submitButton!.onclick = async () => {
    const status = modal.querySelector("[data-memory-status]") as HTMLElement;
    const textarea = modal.querySelector("[data-memory-text]") as HTMLTextAreaElement;
    const anonymous = modal.querySelector("[data-memory-anonymous]") as HTMLInputElement;
    const text = textarea.value.trim();

    if (text.length < 10) {
      status.textContent = "Escreva uma memória com pelo menos 10 caracteres.";
      status.className = "text-[#e74c3c] text-xs font-mono mt-4";
      return;
    }

    const { supabase, services } = await getSupabaseAndServices();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      modal.remove();
      navigateTo("/login");
      return;
    }

    status.textContent = "Enviando...";
    status.className = "text-[#7a9a7a] text-xs font-mono mt-4";

    try {
      await services.createMemory({
        eventId: DEFAULT_EVENT_ID,
        userId: session.user.id,
        authorName: session.user.user_metadata?.full_name ?? session.user.email ?? "Ex-aluno",
        memoryText: text.slice(0, 420),
        isAnonymous: anonymous.checked,
      });
      status.textContent = "Memória enviada para moderação.";
      status.className = "text-[#74c69d] text-xs font-mono mt-4";
      textarea.value = "";
      window.setTimeout(() => modal.remove(), 1200);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Erro ao enviar memória.";
      status.className = "text-[#e74c3c] text-xs font-mono mt-4";
    }
  };

  document.body.appendChild(modal);
}

function makeMemoryButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inline-flex items-center justify-center bg-[#2d6a4f] text-[#f0ebe0] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] hover:bg-[#40916c] transition-colors";
  button.textContent = "Adicionar memória";
  button.onclick = openMemoryModal;
  return button;
}

function buildMemoryCard(memory: any) {
  const card = document.createElement("div");
  card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
  const eyebrow = memory.is_featured ? "Memória destacada" : "Memória da turma";
  const author = memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno");
  card.innerHTML = `
    <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">${eyebrow}</p>
    <p class="text-[#f0ebe0] text-lg leading-relaxed font-['Playfair_Display']">“${escapeHtml(memory.memory_text)}”</p>
    <p class="text-[#7a9a7a] font-mono text-xs mt-4">${escapeHtml(author)} · ${escapeHtml(String(memory.created_at ?? "").slice(0, 10))}</p>
  `;
  return card;
}

async function loadMemories(limit: number) {
  const { services } = await getSupabaseAndServices();
  const memories = await services.getApprovedMemories(DEFAULT_EVENT_ID).catch(() => []);
  return memories.slice(0, limit);
}

function mirrorMemoriesOnHomeTimeline() {
  const section = findSectionByText(/Nossa hist[oó]ria|linha do tempo|hist[oó]ria da turma/i);
  if (!section || section.querySelector("[data-home-memories='true']")) return;

  const root = section.querySelector(".max-w-7xl") as HTMLElement | null;
  if (!root) return;

  const timeline = Array.from(root.children).find((child) => child instanceof HTMLElement && child.innerText.includes("2026")) as HTMLElement | undefined;
  if (!timeline) return;

  const wrapper = document.createElement("div");
  wrapper.className = "grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-10 items-start";
  timeline.parentElement?.insertBefore(wrapper, timeline);
  wrapper.appendChild(timeline);

  const aside = document.createElement("aside");
  aside.dataset.homeMemories = "true";
  aside.className = "bg-[#0d1a0f] border border-[#2d6a4f]/30 p-6";
  aside.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
      <div>
        <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Caixa de memórias</p>
        <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">Memórias da turma</h3>
      </div>
      <div data-home-memory-action></div>
    </div>
    <div data-home-memories-list class="flex flex-col gap-4"><p class="text-[#7a9a7a] text-sm">Carregando memórias aprovadas...</p></div>
  `;
  wrapper.appendChild(aside);
  aside.querySelector("[data-home-memory-action]")?.appendChild(makeMemoryButton());

  loadMemories(4).then((memories) => {
    const list = aside.querySelector("[data-home-memories-list]") as HTMLElement | null;
    if (!list) return;
    list.innerHTML = "";
    if (!memories.length) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma memória aprovada ainda.</p>';
      return;
    }
    memories.forEach((memory) => list.appendChild(buildMemoryCard(memory)));
  });
}

async function addSuperadminHeaderMenuButton() {
  const dropdowns = Array.from(document.querySelectorAll("div")).filter((el) => {
    const text = (el as HTMLElement).innerText || "";
    return text.includes("Editar perfil") && text.includes("Ver meus pedidos") && el.querySelector("button");
  }) as HTMLElement[];

  if (!dropdowns.length) return;

  const { supabase, services } = await getSupabaseAndServices();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  const adminUser = await services.getCurrentAdminUser(session.user.id).catch(() => null);
  if (adminUser?.role !== "superadmin") return;

  for (const dropdown of dropdowns) {
    if (dropdown.querySelector("[data-admin-panel-button='true']")) continue;
    const firstAction = Array.from(dropdown.querySelectorAll("button")).find((button) => (button.textContent || "").trim().toLowerCase() === "editar perfil") as HTMLButtonElement | undefined;
    if (!firstAction) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.adminPanelButton = "true";
    button.className = firstAction.className.replace("text-[#f0ebe0]", "text-[#c9a84c]");
    button.textContent = "Painel administrativo";
    button.onclick = () => navigateTo("/admin");
    firstAction.parentElement?.insertBefore(button, firstAction);
  }
}

function injectLocationIntoClassPage() {
  if (!window.location.pathname.includes("/turma")) return;
  if (document.querySelector("[data-class-location-section='true']")) return;
  const root = pageRoot();
  if (!root) return;

  const section = document.createElement("section");
  section.dataset.classLocationSection = "true";
  section.className = "bg-[#0a120a] border-t border-[#2d6a4f]/20 py-16 mt-16";
  section.innerHTML = `
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Onde a turma está</p>
          <h2 class="text-[#f0ebe0] font-['Playfair_Display'] text-4xl md:text-5xl font-bold">Mapa dos ex-alunos</h2>
        </div>
        <p class="text-[#7a9a7a] text-sm max-w-md">Dados públicos de localização compartilhados pelos perfis da turma.</p>
      </div>
      <div data-class-location-list class="grid grid-cols-1 md:grid-cols-3 gap-4"><p class="text-[#7a9a7a] text-sm">Carregando mapa da turma...</p></div>
    </div>
  `;
  root.appendChild(section);

  getSupabaseAndServices().then(({ services }) => services.getPublicLocationStats()).then((stats) => {
    const list = section.querySelector("[data-class-location-list]") as HTMLElement | null;
    if (!list) return;
    list.innerHTML = "";
    if (!stats.length) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma localização pública cadastrada ainda.</p>';
      return;
    }
    stats.forEach((stat: any) => {
      const card = document.createElement("div");
      card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
      const names = (stat.people || []).slice(0, 4).map((person: any) => person.display_name).filter(Boolean).join(" · ");
      card.innerHTML = `
        <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">${escapeHtml(stat.country ?? "Brasil")}</p>
        <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold">${escapeHtml(stat.city)}${stat.state ? `, ${escapeHtml(stat.state)}` : ""}</h3>
        <p class="text-[#7a9a7a] font-mono text-xs mt-2">${stat.count} ex-aluno${stat.count === 1 ? "" : "s"}</p>
        ${names ? `<p class="text-[#8ab89a] text-sm mt-4 leading-relaxed">${escapeHtml(names)}</p>` : ""}
      `;
      list.appendChild(card);
    });
  }).catch(() => {});
}

function injectMemoriesAndPollsIntoPhotos() {
  if (!window.location.pathname.includes("/fotos")) return;
  const root = pageRoot();
  if (!root) return;

  if (!document.querySelector("[data-photo-memories-section='true']")) {
    const section = document.createElement("section");
    section.dataset.photoMemoriesSection = "true";
    section.className = "bg-[#0d1a0f] border-t border-[#2d6a4f]/20 py-16";
    section.innerHTML = `
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Memórias da turma</p>
            <h2 class="text-[#f0ebe0] font-['Playfair_Display'] text-4xl md:text-5xl font-bold">O que ficou daquele tempo?</h2>
          </div>
          <div data-photo-memory-action></div>
        </div>
        <div data-photo-memories-list class="grid grid-cols-1 md:grid-cols-2 gap-4"><p class="text-[#7a9a7a] text-sm">Carregando memórias...</p></div>
      </div>
    `;
    section.querySelector("[data-photo-memory-action]")?.appendChild(makeMemoryButton());
    root.appendChild(section);
    loadMemories(8).then((memories) => {
      const list = section.querySelector("[data-photo-memories-list]") as HTMLElement | null;
      if (!list) return;
      list.innerHTML = "";
      if (!memories.length) {
        list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma memória aprovada ainda.</p>';
        return;
      }
      memories.forEach((memory) => list.appendChild(buildMemoryCard(memory)));
    });
  }

  if (!document.querySelector("[data-photo-polls-section='true']")) {
    const section = document.createElement("section");
    section.dataset.photoPollsSection = "true";
    section.className = "bg-[#080f08] border-t border-[#2d6a4f]/20 py-16";
    section.innerHTML = `
      <div class="max-w-7xl mx-auto px-4">
        <div class="mb-10">
          <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Enquetes</p>
          <h2 class="text-[#f0ebe0] font-['Playfair_Display'] text-4xl md:text-5xl font-bold">Votações da turma</h2>
        </div>
        <div data-photo-polls-list class="grid grid-cols-1 md:grid-cols-2 gap-4"><p class="text-[#7a9a7a] text-sm">Carregando enquetes...</p></div>
      </div>
    `;
    root.appendChild(section);
    getSupabaseAndServices().then(({ services }) => services.getPolls(DEFAULT_EVENT_ID)).then((polls) => {
      const list = section.querySelector("[data-photo-polls-list]") as HTMLElement | null;
      if (!list) return;
      list.innerHTML = "";
      if (!polls.length) {
        list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma enquete publicada ainda.</p>';
        return;
      }
      polls.slice(0, 6).forEach((poll: any) => {
        const card = document.createElement("div");
        card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
        const options = (poll.poll_options || []).map((option: any) => `<li class="text-[#7a9a7a] text-sm">${escapeHtml(option.option_text)}</li>`).join("");
        card.innerHTML = `<p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Enquete</p><h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold">${escapeHtml(poll.question)}</h3><ul class="mt-4 flex flex-col gap-2">${options}</ul>`;
        list.appendChild(card);
      });
    }).catch(() => {});
  }
}

async function redirectUnifiedLogin() {
  if (!document.body.innerText.includes("Acesso administrativo")) return;
  const { supabase, services } = await getSupabaseAndServices();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  const adminUser = await services.getCurrentAdminUser(session.user.id).catch(() => null);
  if (adminUser) navigateTo("/");
}

function installUnifiedLoginRedirect() {
  getSupabaseAndServices().then(({ supabase }) => {
    supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN") window.setTimeout(() => navigateTo("/"), 50);
    });
  }).catch(() => {});
}

function run() {
  consolidateRoutes();
  cleanupNavigation();
  overrideHomePreviewPhotos();
  mirrorMemoriesOnHomeTimeline();
  injectLocationIntoClassPage();
  injectMemoriesAndPollsIntoPhotos();
  addSuperadminHeaderMenuButton().catch(() => {});
  redirectUnifiedLogin().catch(() => {});
}

if (typeof window !== "undefined") {
  installUnifiedLoginRedirect();
  window.addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  });
}
