import { downloadInviteImage, getTicketQrImageUrl, likelyTicketCode, startQrCameraScanner } from "./ticket-experience";
import { getApprovedMemories, getCurrentAdminUser, getPeople } from "./services";
import { supabase } from "./supabase";
import type { DbMemory, DbPerson } from "./database.types";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

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

function navigateToAdmin() {
  window.history.pushState({}, "", "/admin");
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    <p class="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Caixa de memórias</p>
    <h3 class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold mb-5">Memórias da turma</h3>
    <div data-home-memories-list class="flex flex-col gap-4">
      <p class="text-[#7a9a7a] text-sm">Carregando memórias aprovadas...</p>
    </div>
  `;
  wrapper.appendChild(aside);

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

function run() {
  replaceTicketQr();
  addInviteDownload();
  addCameraControls();
  addSuperadminHeaderMenuButton();
  updateHomePeopleCardsClassGroups();
  mirrorMemoriesOnHomeTimeline();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  });
}
