import { downloadInviteImage, getTicketQrImageUrl, likelyTicketCode, startQrCameraScanner } from "./ticket-experience";
import {
  createMemory,
  getApprovedMemories,
  getCurrentAdminUser,
  getMyPollVotes,
  getPeople,
  getPollResults,
  getPolls,
  getPublicLocationStats,
  votePoll,
} from "./services";
import { supabase } from "./supabase";
import type { DbMemory, DbPerson } from "./database.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const SUPABASE_PUBLIC_BASE = "https://tjnqqsbwgjcdzcxykyif.supabase.co/storage/v1/object/public/photos";
const HOME_PREVIEW_URLS = [1, 2, 3, 4, 5, 6].map(i => `${SUPABASE_PUBLIC_BASE}/home-preview/galera${i}.jpg`);

function replaceTicketQr() {
  const text = document.body.innerText;
  if (!text.includes("Ingresso oficial") && !text.includes("Código do ingresso")) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el => /Ingresso oficial|Código do ingresso/.test(el.innerText) && Boolean(likelyTicketCode(el.innerText)))
    .slice(0, 4);

  for (const card of cards) {
    if (card.querySelector("[data-real-ticket-qr='true']")) continue;
    const code = likelyTicketCode(card.innerText);
    if (!code) continue;

    const host = Array.from(card.querySelectorAll<HTMLElement>("div"))
      .find(el => el.querySelector("svg") && el.getBoundingClientRect().width >= 120);

    if (!host) continue;

    host.innerHTML = "";
    const img = document.createElement("img");
    img.dataset.realTicketQr = "true";
    img.src = getTicketQrImageUrl(code, 224);
    img.alt = `QR Code do ingresso ${code}`;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    host.appendChild(img);

    const note = Array.from(card.querySelectorAll<HTMLElement>("p"))
      .find(p => /QR visual|demonstrativo/i.test(p.innerText));
    if (note) note.innerText = "QR Code real gerado a partir do código textual do ingresso.";
  }
}

function addInviteDownload() {
  if (!document.body.innerText.includes("Convite compartilhável")) return;
  if (document.querySelector("[data-invite-download='true']")) return;

  const actions = Array.from(document.querySelectorAll<HTMLElement>("button"))
    .find(btn => btn.innerText.toLowerCase().includes("copiar texto"))?.parentElement;

  if (!actions) return;

  const button = document.createElement("button");
  button.dataset.inviteDownload = "true";
  button.type = "button";
  button.className = "inline-flex items-center justify-center gap-2 bg-[#141f14] border border-[#2d6a4f]/35 text-[#f0ebe0] px-5 py-3 text-xs font-mono uppercase tracking-wider hover:border-[#c9a84c]/70 transition-colors";
  button.textContent = "Baixar imagem";
  button.onclick = () => {
    const cardText = Array.from(document.querySelectorAll<HTMLElement>("div"))
      .map(el => el.innerText)
      .find(t => t.includes("Eu vou ao reencontro da Turma 2006")) ?? "";

    const lines = cardText.split("\n").map(s => s.trim()).filter(Boolean);
    const dateLabel = lines.find(l => /^\d{1,2}\//.test(l) || /Out|2026|h/.test(l)) ?? "17 Out 2026 · 19h";
    const locationLabel = lines.find(l => /Natal|Espaço|Local/i.test(l)) ?? "Natal, RN";
    const name = lines.find(l => !/Colégio|Eu vou|Data|Hora|Local|20 anos/i.test(l) && l.length > 3 && l.length < 80) ?? "";

    downloadInviteImage({ name, useName: Boolean(name), dateLabel, locationLabel });
  };

  actions.appendChild(button);
}

function setReactInput(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function addCameraControls() {
  if (!document.body.innerText.includes("Check-in") || !document.body.innerText.includes("Busca manual")) return;
  if (document.querySelector("[data-camera-scan='true']")) return;

  const host = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .find(el => el.innerText.includes("Leitura por câmera"));

  if (!host) return;

  const wrap = host.parentElement?.parentElement ?? host.parentElement ?? host;
  const controls = document.createElement("div");
  controls.dataset.cameraScan = "true";
  controls.className = "mt-4 flex flex-col gap-2";

  const status = document.createElement("p");
  status.className = "text-[#7a9a7a] text-xs font-mono";
  status.innerText = "Leitor QR pronto.";

  const video = document.createElement("video");
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";

  let stopScanner: (() => void) | null = null;

  const start = document.createElement("button");
  start.type = "button";
  start.className = "bg-[#2d6a4f] text-[#f0ebe0] px-4 py-3 text-xs font-mono uppercase tracking-wider";
  start.textContent = "Ativar câmera";
  start.onclick = async () => {
    host.innerHTML = "";
    host.appendChild(video);

    stopScanner = await startQrCameraScanner({
      video,
      onStatus: (_scannerStatus, message) => { status.innerText = message; },
      onDetected: value => {
        const input = Array.from(document.querySelectorAll<HTMLInputElement>("input"))
          .find(el => /HC2006|participante|email|telefone/i.test(el.placeholder ?? ""));
        if (input) setReactInput(input, value);

        Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
          .find(btn => btn.innerText.toLowerCase().includes("verificar ingresso"))?.click();
      },
    }).catch(error => {
      status.innerText = error instanceof Error ? error.message : "Não foi possível acessar a câmera.";
      return null;
    });
  };

  const stop = document.createElement("button");
  stop.type = "button";
  stop.className = "border border-[#2d6a4f]/40 text-[#7a9a7a] px-4 py-3 text-xs font-mono uppercase tracking-wider";
  stop.textContent = "Parar leitura";
  stop.onclick = () => {
    stopScanner?.();
    status.innerText = "Leitura pausada.";
  };

  controls.appendChild(start);
  controls.appendChild(stop);
  controls.appendChild(status);
  wrap.appendChild(controls);
}

let cachedAdminRole: string | null | undefined;

async function getCachedAdminRole() {
  if (cachedAdminRole !== undefined) return cachedAdminRole;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    cachedAdminRole = null;
    return cachedAdminRole;
  }

  const adminUser = await getCurrentAdminUser(session.user.id).catch(() => null);
  cachedAdminRole = adminUser?.role ?? null;
  return cachedAdminRole;
}

function navigateToPage(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

function navigateToAdmin() {
  navigateToPage("/admin");
}

function addSuperadminHeaderMenuButton() {
  const dropdowns = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el =>
      el.innerText.includes("Editar perfil") &&
      el.innerText.includes("Ver meus pedidos") &&
      el.querySelector("button")
    );

  for (const dropdown of dropdowns) {
    if (dropdown.querySelector("[data-admin-panel-button='true']")) continue;
    if (dropdown.dataset.adminPanelCheck === "pending") continue;
    dropdown.dataset.adminPanelCheck = "pending";

    getCachedAdminRole().then(role => {
      delete dropdown.dataset.adminPanelCheck;
      if (role !== "superadmin") return;
      if (!document.body.contains(dropdown)) return;
      if (dropdown.querySelector("[data-admin-panel-button='true']")) return;

      const firstAction = Array.from(dropdown.querySelectorAll<HTMLButtonElement>("button"))
        .find(button => button.innerText.trim().toLowerCase() === "editar perfil");
      if (!firstAction) return;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.adminPanelButton = "true";
      button.className = firstAction.className.replace("text-[#f0ebe0]", "text-[#c9a84c]");
      button.textContent = "Painel administrativo";
      button.onclick = navigateToAdmin;
      firstAction.parentElement?.insertBefore(button, firstAction);
    });
  }
}

let cachedPeople: DbPerson[] | null = null;
let peopleLoading: Promise<DbPerson[]> | null = null;

async function getCachedPeople() {
  if (cachedPeople) return cachedPeople;
  if (!peopleLoading) {
    peopleLoading = getPeople().catch(() => [] as DbPerson[]);
  }
  cachedPeople = await peopleLoading;
  return cachedPeople;
}

function findSectionByText(pattern: RegExp) {
  return Array.from(document.querySelectorAll<HTMLElement>("section"))
    .find(section => pattern.test(section.innerText));
}

function updateHomePeopleCardsClassGroups() {
  const section = findSectionByText(/Quem já|Confirmados|lista completa|Apenas pessoas que autorizaram/i);
  if (!section || section.dataset.classGroupAdjusted === "pending") return;

  section.dataset.classGroupAdjusted = "pending";
  getCachedPeople().then(people => {
    const peopleByName = new Map(people.map(person => [person.full_name.trim().toLowerCase(), person]));
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[role='button'], div"))
      .filter(card => Array.from(card.querySelectorAll("p")).some(p => peopleByName.has((p.textContent ?? "").trim().toLowerCase())));

    for (const card of cards) {
      if (card.dataset.classGroupLabelApplied === "true") continue;
      const nameEl = Array.from(card.querySelectorAll<HTMLParagraphElement>("p"))
        .find(p => peopleByName.has((p.textContent ?? "").trim().toLowerCase()));
      if (!nameEl) continue;

      const person = peopleByName.get((nameEl.textContent ?? "").trim().toLowerCase());
      if (!person?.class_group) continue;

      const parent = nameEl.parentElement;
      if (!parent) continue;
      const label = Array.from(parent.querySelectorAll<HTMLParagraphElement>("p"))[1] ?? document.createElement("p");
      label.textContent = `Turma ${person.class_group}`;
      label.className = "text-[#c9a84c] text-xs font-mono mt-0.5";
      if (!label.parentElement) nameEl.insertAdjacentElement("afterend", label);
      card.dataset.classGroupLabelApplied = "true";
    }

    delete section.dataset.classGroupAdjusted;
  });
}

let cachedMemories: DbMemory[] | null = null;
let memoriesLoading: Promise<DbMemory[]> | null = null;

async function getCachedMemories() {
  if (cachedMemories) return cachedMemories;
  if (!memoriesLoading) {
    memoriesLoading = getApprovedMemories(DEFAULT_EVENT_ID).catch(() => [] as DbMemory[]);
  }
  cachedMemories = await memoriesLoading;
  return cachedMemories;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildMemoryCard(memory: DbMemory) {
  const card = document.createElement("div");
  card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
  const eyebrow = memory.is_featured ? "Memória destacada" : "Memória da turma";
  const author = memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno");
  card.innerHTML = `
    <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">${eyebrow}</p>
    <p class="text-[#f0ebe0] text-lg leading-relaxed font-['Playfair_Display']">“${escapeHtml(memory.memory_text)}”</p>
    <p class="text-[#7a9a7a] font-mono text-xs mt-4">${escapeHtml(author)} · ${memory.created_at?.slice(0, 10) ?? ""}</p>
  `;
  return card;
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

  modal.querySelectorAll<HTMLElement>("[data-close-memory-modal]").forEach(button => {
    button.onclick = () => modal.remove();
  });

  modal.querySelector<HTMLButtonElement>("[data-submit-memory]")!.onclick = async () => {
    const status = modal.querySelector<HTMLElement>("[data-memory-status]")!;
    const textarea = modal.querySelector<HTMLTextAreaElement>("[data-memory-text]")!;
    const anonymous = modal.querySelector<HTMLInputElement>("[data-memory-anonymous]")!;
    const text = textarea.value.trim();

    if (text.length < 10) {
      status.textContent = "Escreva uma memória com pelo menos 10 caracteres.";
      status.className = "text-[#e74c3c] text-xs font-mono mt-4";
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      modal.remove();
      navigateToPage("/login");
      return;
    }

    status.textContent = "Enviando...";
    status.className = "text-[#7a9a7a] text-xs font-mono mt-4";

    try {
      await createMemory({
        eventId: DEFAULT_EVENT_ID,
        userId: session.user.id,
        authorName: session.user.user_metadata?.full_name ?? session.user.email ?? "Ex-aluno",
        memoryText: text.slice(0, 420),
        isAnonymous: anonymous.checked,
      });
      status.textContent = "Memória enviada para moderação.";
      status.className = "text-[#74c69d] text-xs font-mono mt-4";
      textarea.value = "";
      cachedMemories = null;
      memoriesLoading = null;
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

function mirrorMemoriesOnHomeTimeline() {
  const section = findSectionByText(/Nossa hist[oó]ria|linha do tempo|hist[oó]ria da turma/i);
  if (!section || section.querySelector("[data-home-memories='true']")) return;

  const root = section.querySelector<HTMLElement>(".max-w-7xl") ?? section;
  const timeline = Array.from(root.children).find(child =>
    child instanceof HTMLElement && child.className.includes("flex flex-col") && child.innerText.includes("2026")
  ) as HTMLElement | undefined;
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
    <div data-home-memories-list class="flex flex-col gap-4">
      <p class="text-[#7a9a7a] text-sm">Carregando memórias aprovadas...</p>
    </div>
  `;
  wrapper.appendChild(aside);
  aside.querySelector<HTMLElement>("[data-home-memory-action]")?.appendChild(makeMemoryButton());

  getCachedMemories().then(memories => {
    const list = aside.querySelector<HTMLElement>("[data-home-memories-list]");
    if (!list) return;
    list.innerHTML = "";
    const visible = memories.slice(0, 4);
    if (visible.length === 0) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma memória aprovada ainda.</p>';
      return;
    }
    visible.forEach(memory => list.appendChild(buildMemoryCard(memory)));
  });
}

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

async function ensureSuperadminProfileLink() {
  if (!window.location.pathname.includes("/editar-perfil")) return;
  if (!document.body.innerText.includes("Perfil ainda não reivindicado")) return;
  if (document.body.dataset.superadminProfileLink === "pending") return;

  document.body.dataset.superadminProfileLink = "pending";

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const adminUser = await getCurrentAdminUser(session.user.id).catch(() => null);
    if (adminUser?.role !== "superadmin") return;

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (currentProfile?.id) {
      window.location.reload();
      return;
    }

    const emailPrefix = normalizeLookup(session.user.email?.split("@")[0] ?? "");
    const metadataName = normalizeLookup(session.user.user_metadata?.full_name ?? "");
    const searchTokens = [
      emailPrefix.slice(0, 6),
      emailPrefix.slice(0, 5),
      metadataName.slice(0, 8),
      metadataName.slice(0, 6),
    ].filter(token => token.length >= 5);

    const people = await getCachedPeople();
    const candidates = people.filter(person => {
      const fullName = normalizeLookup(person.full_name);
      return searchTokens.some(token => fullName.includes(token) || token.includes(fullName.slice(0, 6)));
    });

    if (candidates.length !== 1) return;

    const person = candidates[0];
    const now = new Date().toISOString();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("person_id", person.id)
      .maybeSingle();

    if (existingProfile?.id) {
      await supabase
        .from("profiles")
        .update({
          user_id: session.user.id,
          display_name: existingProfile.display_name ?? person.full_name,
        })
        .eq("id", existingProfile.id);
    } else {
      await supabase
        .from("profiles")
        .insert({
          person_id: person.id,
          user_id: session.user.id,
          display_name: person.full_name,
          current_country: "Brasil",
        });
    }

    await supabase
      .from("people")
      .update({
        claimed_by_user_id: session.user.id,
        profile_status: "confirmed",
        claimed_at: person.claimed_at ?? now,
      })
      .eq("id", person.id);

    window.location.reload();
  } finally {
    delete document.body.dataset.superadminProfileLink;
  }
}

async function redirectUnifiedLogin() {
  if (!document.body.innerText.includes("Acesso administrativo")) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  const adminUser = await getCurrentAdminUser(session.user.id).catch(() => null);
  if (!adminUser) return;
  navigateToPage("/");
}

function installUnifiedLoginRedirect() {
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "SIGNED_IN") return;
    window.setTimeout(() => navigateToPage("/"), 50);
  });
}

function consolidateRoutes() {
  const pathname = window.location.pathname;
  if (pathname.includes("/mapa")) {
    navigateToPage("/turma");
  } else if (pathname.includes("/memorias") || pathname.includes("/enquetes")) {
    navigateToPage("/fotos");
  }
}

function cleanupNavigation() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  for (const button of buttons) {
    const text = button.textContent?.trim().toLowerCase();
    if (!text) continue;
    if (text === "a turma") button.textContent = "Ex-alunos";
    if (text === "acervo") button.textContent = "Pós-festa";
    if (["mapa", "memórias", "enquetes"].includes(text)) {
      button.style.display = "none";
      button.setAttribute("aria-hidden", "true");
    }
  }
}

function overrideHomePreviewPhotos() {
  const section = findSectionByText(/Fotos fictícias|fotos ficticias|fotos antigas|época/i);
  if (!section || section.dataset.homePreviewPhotos === "done") return;
  const images = Array.from(section.querySelectorAll<HTMLImageElement>("img")).slice(0, 6);
  if (images.length === 0) return;
  images.forEach((img, index) => {
    img.src = HOME_PREVIEW_URLS[index];
    img.removeAttribute("srcset");
    img.alt = `Foto da turma ${index + 1}`;
    img.dataset.homePreviewOverride = "true";
  });
  section.dataset.homePreviewPhotos = "done";
}

function pageRoot() {
  const main = document.querySelector<HTMLElement>("main");
  return main?.firstElementChild instanceof HTMLElement ? main.firstElementChild : main;
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
      <div data-class-location-list class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <p class="text-[#7a9a7a] text-sm">Carregando mapa da turma...</p>
      </div>
    </div>
  `;
  root.appendChild(section);

  getPublicLocationStats().then(stats => {
    const list = section.querySelector<HTMLElement>("[data-class-location-list]");
    if (!list) return;
    list.innerHTML = "";
    if (stats.length === 0) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma localização pública cadastrada ainda.</p>';
      return;
    }
    stats.forEach(stat => {
      const card = document.createElement("div");
      card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
      const names = stat.people.slice(0, 4).map(person => person.display_name).filter(Boolean).join(" · ");
      card.innerHTML = `
        <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">${stat.country ?? "Brasil"}</p>
        <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold">${escapeHtml(stat.city)}${stat.state ? `, ${escapeHtml(stat.state)}` : ""}</h3>
        <p class="text-[#7a9a7a] font-mono text-xs mt-2">${stat.count} ex-aluno${stat.count === 1 ? "" : "s"}</p>
        ${names ? `<p class="text-[#8ab89a] text-sm mt-4 leading-relaxed">${escapeHtml(names)}</p>` : ""}
      `;
      list.appendChild(card);
    });
  });
}

function buildPhotoMemoriesSection() {
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
      <div data-photo-memories-list class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <p class="text-[#7a9a7a] text-sm">Carregando memórias...</p>
      </div>
    </div>
  `;
  section.querySelector<HTMLElement>("[data-photo-memory-action]")?.appendChild(makeMemoryButton());
  getCachedMemories().then(memories => {
    const list = section.querySelector<HTMLElement>("[data-photo-memories-list]");
    if (!list) return;
    list.innerHTML = "";
    if (memories.length === 0) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma memória aprovada ainda.</p>';
      return;
    }
    memories.slice(0, 8).forEach(memory => list.appendChild(buildMemoryCard(memory)));
  });
  return section;
}

async function buildPollCard(poll: any) {
  const card = document.createElement("div");
  card.className = "bg-[#141f14] border border-[#2d6a4f]/25 p-5";
  const options = [...(poll.poll_options ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const results = await getPollResults(poll.id).catch(() => ({} as Record<string, number>));
  const total = Object.values(results).reduce((sum, value) => sum + value, 0);
  const { data: { session } } = await supabase.auth.getSession();
  const myVotes = session?.user ? await getMyPollVotes(session.user.id, [poll.id]).catch(() => []) : [];
  const voted = new Set(myVotes.map(vote => vote.option_id));

  card.innerHTML = `
    <p class="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">${poll.status === "closed" ? "Enquete encerrada" : "Enquete aberta"}</p>
    <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold">${escapeHtml(poll.question)}</h3>
    ${poll.description ? `<p class="text-[#7a9a7a] text-sm mt-2">${escapeHtml(poll.description)}</p>` : ""}
    <div data-poll-options class="flex flex-col gap-3 mt-5"></div>
  `;

  const host = card.querySelector<HTMLElement>("[data-poll-options]")!;
  options.forEach(option => {
    const count = results[option.id] ?? 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `text-left border p-3 transition-colors ${voted.has(option.id) ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 hover:border-[#2d6a4f]/60"}`;
    button.innerHTML = `
      <div class="flex items-center justify-between gap-3 mb-2">
        <span class="text-[#f0ebe0] text-sm font-semibold">${escapeHtml(option.option_text)}</span>
        <span class="text-[#c9a84c] font-mono text-xs">${pct}%</span>
      </div>
      <div class="h-1.5 bg-[#0a120a] overflow-hidden"><div style="width:${pct}%" class="h-full bg-[#2d6a4f]"></div></div>
      <p class="text-[#7a9a7a] font-mono text-[10px] mt-2">${count} voto${count === 1 ? "" : "s"}</p>
    `;
    button.onclick = async () => {
      if (poll.status === "closed") return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigateToPage("/login");
        return;
      }
      await votePoll({ pollId: poll.id, optionId: option.id, userId: session.user.id, allowMultiple: poll.allow_multiple_votes });
      card.replaceWith(await buildPollCard(poll));
    };
    host.appendChild(button);
  });

  return card;
}

function buildPhotoPollsSection() {
  const section = document.createElement("section");
  section.dataset.photoPollsSection = "true";
  section.className = "bg-[#080f08] border-t border-[#2d6a4f]/20 py-16";
  section.innerHTML = `
    <div class="max-w-7xl mx-auto px-4">
      <div class="mb-10">
        <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Enquetes</p>
        <h2 class="text-[#f0ebe0] font-['Playfair_Display'] text-4xl md:text-5xl font-bold">Votações da turma</h2>
      </div>
      <div data-photo-polls-list class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <p class="text-[#7a9a7a] text-sm">Carregando enquetes...</p>
      </div>
    </div>
  `;

  getPolls(DEFAULT_EVENT_ID).then(async polls => {
    const list = section.querySelector<HTMLElement>("[data-photo-polls-list]");
    if (!list) return;
    list.innerHTML = "";
    if (polls.length === 0) {
      list.innerHTML = '<p class="text-[#7a9a7a] text-sm">Nenhuma enquete publicada ainda.</p>';
      return;
    }
    const cards = await Promise.all(polls.slice(0, 6).map(poll => buildPollCard(poll)));
    cards.forEach(card => list.appendChild(card));
  });

  return section;
}

function injectMemoriesAndPollsIntoPhotos() {
  if (!window.location.pathname.includes("/fotos")) return;
  const root = pageRoot();
  if (!root) return;
  if (!document.querySelector("[data-photo-memories-section='true']")) {
    root.appendChild(buildPhotoMemoriesSection());
  }
  if (!document.querySelector("[data-photo-polls-section='true']")) {
    root.appendChild(buildPhotoPollsSection());
  }
}

async function redirectUnifiedLogin() {
  if (!document.body.innerText.includes("Acesso administrativo")) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  const adminUser = await getCurrentAdminUser(session.user.id).catch(() => null);
  if (!adminUser) return;
  navigateToPage("/");
}

function installUnifiedLoginRedirect() {
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "SIGNED_IN") return;
    window.setTimeout(() => navigateToPage("/"), 50);
  });
}

function run() {
  consolidateRoutes();
  cleanupNavigation();
  replaceTicketQr();
  addInviteDownload();
  addCameraControls();
  addSuperadminHeaderMenuButton();
  updateHomePeopleCardsClassGroups();
  mirrorMemoriesOnHomeTimeline();
  overrideHomePreviewPhotos();
  injectLocationIntoClassPage();
  injectMemoriesAndPollsIntoPhotos();
  redirectUnifiedLogin().catch(() => {});
  ensureSuperadminProfileLink().catch(() => {});
}

if (typeof window !== "undefined") {
  installUnifiedLoginRedirect();
  window.addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  });
}
