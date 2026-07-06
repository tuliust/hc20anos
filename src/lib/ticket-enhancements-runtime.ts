import { downloadInviteImage, getTicketQrImageUrl, likelyTicketCode, startQrCameraScanner } from "./ticket-experience";

function replaceTicketQr() {
  const text = document.body.innerText;
  if (!text.includes("Ingresso oficial") && !text.includes("CÃ³digo do ingresso")) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el => /Ingresso oficial|CÃ³digo do ingresso/.test(el.innerText) && Boolean(likelyTicketCode(el.innerText)))
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
    if (note) note.innerText = "QR Code real gerado a partir do cÃ³digo textual do ingresso.";
  }
}

function addInviteDownload() {
  if (!document.body.innerText.includes("Convite compartilhÃ¡vel")) return;
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
    const dateLabel = lines.find(l => /^\d{1,2}\//.test(l) || /Out|2026|h/.test(l)) ?? "17 Out 2026 Â· 19h";
    const locationLabel = lines.find(l => /Natal|EspaÃ§o|Local/i.test(l)) ?? "Natal, RN";
    const name = lines.find(l => !/ColÃ©gio|Eu vou|Data|Hora|Local|20 anos/i.test(l) && l.length > 3 && l.length < 80) ?? "";

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
    .find(el => el.innerText.includes("Leitura por cÃ¢mera"));

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
  start.textContent = "Ativar cÃ¢mera";
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
      status.innerText = error instanceof Error ? error.message : "NÃ£o foi possÃ­vel acessar a cÃ¢mera.";
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

function run() {
  replaceTicketQr();
  addInviteDownload();
  addCameraControls();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  });
}
