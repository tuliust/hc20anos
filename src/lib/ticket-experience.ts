// ================================================================
// Ticket experience helpers
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

export type CameraScanStatus =
  | "idle"
  | "unsupported"
  | "permission_denied"
  | "active"
  | "success"
  | "paused"
  | "error";

export function getTicketQrImageUrl(code: string, size = 224) {
  return `${QR_SERVICE_URL}?size=${size}&margin=1&text=${encodeURIComponent(code)}`;
}

export function likelyTicketCode(text: string): string | null {
  const matches = text.match(CODE_RE) ?? [];
  return matches.find(code => /\d/.test(code) && code.includes("-"))
    ?? matches.find(code => /\d/.test(code) && code.length >= 8)
    ?? null;
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

export function downloadInviteImage(params: {
  name?: string;
  dateLabel: string;
  locationLabel: string;
  useName: boolean;
}) {
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
  if (params.useName && params.name) {
    ctx.fillStyle = "#2d6a4f";
    ctx.font = "700 42px ui-sans-serif, system-ui";
    y += 20;
    y = wrapText(ctx, params.name, 96, y, 880, 52);
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
  ctx.fillText(params.dateLabel, 96, y + 172);

  ctx.fillStyle = "#66745B";
  ctx.font = "700 24px ui-monospace, monospace";
  ctx.fillText("LOCAL", 96, y + 260);
  ctx.fillStyle = "#0d1a0f";
  ctx.font = "700 44px ui-sans-serif, system-ui";
  wrapText(ctx, params.locationLabel, 96, y + 318, 880, 54);

  ctx.fillStyle = "#5b4636";
  ctx.font = "32px Georgia, serif";
  wrapText(ctx, "20 anos depois, a turma se reencontra para celebrar histórias, fotos antigas e vínculos que atravessaram o tempo.", 96, 1110, 880, 44);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    downloadBlobUrl(url, "convite-turma-2006.png");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

export function isCameraQrSupported() {
  return Boolean(window.BarcodeDetector && navigator.mediaDevices?.getUserMedia);
}

export async function startQrCameraScanner(params: {
  video: HTMLVideoElement;
  onDetected: (value: string) => void;
  onStatus?: (status: CameraScanStatus, message: string) => void;
}): Promise<() => void> {
  if (!window.BarcodeDetector) {
    params.onStatus?.("unsupported", "Leitura por câmera indisponível neste navegador. Use o código textual.");
    return () => undefined;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    params.onStatus?.("unsupported", "Câmera indisponível neste dispositivo.");
    return () => undefined;
  }

  let active = true;
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  params.video.autoplay = true;
  params.video.muted = true;
  params.video.playsInline = true;
  params.video.srcObject = stream;
  params.onStatus?.("active", "Câmera ativa. Aponte para o QR Code do ingresso.");

  const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  const scanFrame = async () => {
    if (!active) return;
    try {
      const codes = await detector.detect(params.video);
      const rawValue = codes[0]?.rawValue?.trim();
      if (rawValue) {
        active = false;
        stream.getTracks().forEach(track => track.stop());
        params.onStatus?.("success", `Código lido: ${rawValue}`);
        params.onDetected(rawValue);
        return;
      }
    } catch {
      // Ignora frames sem leitura.
    }
    requestAnimationFrame(scanFrame);
  };
  requestAnimationFrame(scanFrame);

  return () => {
    active = false;
    stream.getTracks().forEach(track => track.stop());
    params.onStatus?.("paused", "Leitura pausada.");
  };
}
