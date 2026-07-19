import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

type BarcodeDetectorShape = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorShape;
  }
}

export function CheckinScanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stop() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    frameRef.current = null;
    setActive(false);
  }

  useEffect(() => stop, []);

  async function start() {
    setError(null);
    if (!window.BarcodeDetector) {
      setError("Leitor de QR Code não suportado neste navegador. Use a busca manual por código.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setActive(true);
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const value = results[0]?.rawValue?.trim();
          if (value) {
            onCode(value);
            stop();
            return;
          }
        } catch {
          // Alguns frames podem falhar durante foco ou mudança de câmera.
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setError("Não foi possível acessar a câmera. Confira a permissão do navegador.");
      stop();
    }
  }

  return <section className="operations-scanner">
    <button type="button" onClick={() => active ? stop() : void start()}>{active ? <CameraOff size={18}/> : <Camera size={18}/>} {active ? "Fechar câmera" : "Ler QR Code"}</button>
    <video ref={videoRef} playsInline muted hidden={!active}/>
    {error && <small>{error}</small>}
  </section>;
}