// ================================================================
// Ticket experience enhancements
// QR real, leitura por câmera e download de convite sem novas deps.
// ================================================================

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorInstance = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const QR_SERVICE_URL = "https://quickchart.io/qr";
const CODE_RE = /\b[A-Z0-9][A-Z0-9_-]{5,80}\b/g;
let cameraStream: MediaStream | null = null;
let scanning = false;

function qrSrc(code: string, size = 224) {
  return `${QR_SERVICE_URL}?size=${size}&margin=1&text=${encodeURIComponent(code)}`;
}

function likelyTicketCode(text: string): string | null {
  const matches = text.match(CODE_RE) ?? [];
  return matches.find(code => code.includes("-") || code.length >= 8) ?? null;
}

function addRealQrCodes() {
  const rootText = document.body.innerText;
  if (!rootText.includes("Meu ingresso") && !rootText.includes("Ingresso oficial") && !rootText.includes("Código do ingresso")) return;

  const candidateCards = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter(el => {
      const text = el.innerText || "";
      return (text.includes("Ingresso oficial") || text.includes("Código do ingresso")) && Boolean(likelyTicketCode(text));
    })
    .slice(0, 4);

  for (const card of candidateCards) {
    if (card.querySelector("[data-real-ticket-qr='true']")) continue;
    const code = likelyTicketCode(card.innerText || "");
    if (!code) continue;

    const qrHost = Array.from(card.querySelectorAll<HTMLElement>("div"))
      .find(el => el.querySelector("svg") && (el.className.includes("w-48") || el.className.includes("w-40") || el.getBoundingClientRect().width >= 120));
    if (!qrHost) continue;

    qrHost.innerHTML = "";
    const img = document.createElement("img");
    img.dataset.realTicketQr = "true";
    img.src = qrSrc(code);
    img.alt = `QR Code do ingresso ${code}`;
    img.width = 192;
    img.height = 192;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    qrHost.appendChild(img);

    const note = Array.from(card.querySelectorAll<HTMLElement>("p"))
      .find(p => /QR visual|demonstrativo/i.test(p.innerText));
    if (note) note.innerText = "QR Code real gerado a partir do código textual do ingresso.";
  }
}

function downloadBlobUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineHeight;
}

function createInviteImage() {
  const text = document.body.innerText;
  if (!text.includes("Convite compartilhável")) return;
  if (document.querySelector("[data-invite-download='true']")) return;

  const actions = Array.from(document.querySelectorAll<HTMLElement>("button"))
    .find(btn => btn.innerText.trim().toLowerCase().includes("copiar texto"))?.parentElement;
  if (!actions) return;

  const button = document.createElement("button");
  button.dataset.inviteDownload = "true";
  button.type = "button";
  button.className = "inline-flex items-center justify-center gap-2 bg-[#141f14] border border-[#2d6a4f]/35 text-[#f0ebe0] px-5 py-3 text-xs font-mono uppercase tracking-wider hover:border-[#c9a84c]/70 transition-colors";
  button.textContent = "Baixar imagem";
  button.onclick = () => {
    const cardText = Array.from(document.querySelectorAll<HTMLElement>("div"))
      .map(el => el.innerText)
      .find(t => t.includes("Eu vou ao reencontro da Turma 2006")) ?? text;
    const lines = cardText.split("\n").map(s => s.trim()).filter(Boolean);
    const dateLine = lines.find(l => /^\d{1,2}\//.test(l) || /Out|2026|h/.test(l)) ?? "17 Out 2026 · 19h";
    const location = lines.find(l => /Natal|Espaço|Local/i.test(l)) ?? "Natal, RN";
    const name = lines.find(l => !/Colégio|Eu vou|Data|Hora|Local|20 anos/i.test(l) && l.length > 3 && l.length < 80) ?? "";

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f0ebe0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 28;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.fillStyle = "#2d6a4f";
    ctx.font = "700 28px ui-monospace, monospace";
    ctx.fillText("COLÉGIO HENRIQUE CASTRICIANO", 96, 150);

    ctx.fillStyle = "#0d1a0f";
    ctx.font = "900 86px Georgia, serif";
    let y = wrapText(ctx, "Eu vou ao reencontro da Turma 2006", 96, 315, 880, 96);
    if (name) {
      ctx.fillStyle = "#2d6a4f";
      ctx.font = "700 42px ui-sans-serif, system-ui";
      y += 20;
      y = wrapText(ctx, name, 96, y, 880, 52);
    }

    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(96, y + 24);
    ctx.lineTo(984, y + 24);
    ctx.stroke();

    ctx.fillStyle = "#66745B";
    ctx.font = "700 24px ui-monospace, monospace";
    ctx.fillText("DATA E HORA", 96, y + 115);
    ctx.fillStyle = "#0d1a0f";
    ctx.font = "700 44px ui-sans-serif, system-ui";
    ctx.fillText(dateLine, 96, y + 172);

    ctx.fillStyle = "#66745B";
    ctx.font = "700 24px ui-monospace, monospace";
    ctx.fillText("LOCAL", 96, y + 260);
    ctx.fillStyle = "#0d1a0f";
    ctx.font = "700 44px ui-sans-serif, system-ui";
    wrapText(ctx, location, 96, y + 318, 880, 54);

    ctx.fillStyle = "#5b4636";
    ctx.font = "32px Georgia, serif";
    wrapText(ctx, "20 anos depois, a turma se reencontra para celebrar histórias, fotos antigas e vínculos que atravessaram o tempo.", 96, 1110, 880, 44);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      downloadBlobUrl(url, "convite-turma-2006.png");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  actions.appendChild(button);
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function startCameraScan(host: HTMLElement, status: HTMLElement) {
  if (!window.BarcodeDetector) {
    status.innerText = "Leitura por câmera indisponível neste navegador. Use o código textual.";
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    status.innerText = "Câmera indisponível neste dispositivo.";
    return;
  }

  const video = host.querySelector<HTMLVideoElement>("video") ?? document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";
  host.innerHTML = "";
  host.appendChild(video);

  cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = cameraStream;
  scanning = true;
  status.innerText = "Câmera ativa. Aponte para o QR Code do ingresso.";

  const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  const scanFrame = async () => {
    if (!scanning) return;
    try {
      const codes = await detector.detect(video);
      const rawValue = codes[0]?.rawValue?.trim();
      if (rawValue) {
        scanning = false;
        cameraStream?.getTracks().forEach(track => track.stop());
        status.innerText = `Código lido: ${rawValue}`;
        const input = Array.from(document.querySelectorAll<HTMLInputElement>("input"))
          .find(el => /HC2006|ingresso|email|participante|telefone/i.test(el.placeholder ?? ""));
        if (input) setInputValue(input, rawValue);
        const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
          .find(btn => btn.innerText.trim().toLowerCase().includes("verificar ingresso"));
        button?.click();
        return;
      }
    } catch {
      // Ignora frames sem leitura.
    }
    requestAnimationFrame(scanFrame);
  };
  requestAnimationFrame(scanFrame);
}

function addCameraScanner() {
  const text = document.body.innerText;
  if (!text.includes("Check-in") || !text.includes("Busca manual")) return;
  if (document.querySelector("[data-camera-scan='true']")) return;

  const host = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .find(el => el.innerText.includes("Leitura por câmera") || el.innerText.includes("câmera"));
  if (!host) return;

  const wrapper = host.closest("div.bg-\[\#141f14\]") as HTMLElement | null;
  const status = document.createElement("p");
  status.className = "text-[#7a9a7a] text-xs font-mono mt-3";
  status.innerText = "Leitor QR pronto.";

  const controls = document.createElement("div");
  controls.dataset.cameraScan = "true";
  controls.className = "mt-4 flex flex-col gap-2";

  const start = document.createElement("button");
  start.type = "button";
  start.className = "bg-[#2d6a4f] text-[#f0ebe0] px-4 py-3 text-xs font-mono uppercase tracking-wider";
  start.textContent = "Ativar câmera";
  start.onclick = () => startCameraScan(host, status).catch(error => {
    status.innerText = error instanceof Error ? error.message : "Não foi possível acessar a câmera.";
  });

  const stop = document.createElement("button");
  stop.type = "button";
  stop.className = "border border-[#2d6a4f]/40 text-[#7a9a7a] px-4 py-3 text-xs font-mono uppercase tracking-wider";
  stop.textContent = "Parar leitura";
  stop.onclick = () => {
    scanning = false;
    cameraStream?.getTracks().forEach(track => track.stop());
    status.innerText = "Leitura pausada.";
  };

  controls.appendChild(start);
  controls.appendChild(stop);
  controls.appendChild(status);
  wrapper?.appendChild(controls);
}

function runEnhancements() {
  addRealQrCodes();
  createInviteImage();
  addCameraScanner();
}

if (typeof window !== "undefined") {
  const observer = new MutationObserver(() => runEnhancements());
  window.addEventListener("DOMContentLoaded", () => {
    runEnhancements();
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
