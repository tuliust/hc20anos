import { useEffect, useState } from "react";
import { Camera, CreditCard, MessageCircle } from "lucide-react";
import { getEventArchiveSettings, getEventSettings } from "../../lib/services";
import type { DbEvent, DbEventArchiveSettings } from "../../lib/content.types";
import type { Page } from "../app.types";
import { DEFAULT_EVENT_ID, FALLBACK_EVENT_DATE_TIME } from "../app.constants";
import { getEventDateTime } from "../appFormatters";
import { Btn, DisplayTitle, ErrorState, LoadingState, SectionLabel, StatusBadge } from "../components/AppPrimitives";

export function ArchivePage({ navigate }: { navigate: (p: Page) => void }) {
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [settings, setSettings] = useState<DbEventArchiveSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadArchive() {
      setLoading(true);
      setError("");
      try {
        const [eventData, settingsData] = await Promise.all([
          getEventSettings().catch(() => null),
          getEventArchiveSettings(DEFAULT_EVENT_ID).catch(() => null),
        ]);
        if (!active) return;
        setEvent(eventData);
        setSettings(settingsData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar acervo.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadArchive();
    return () => { active = false; };
  }, []);

  const dateSource = event ? getEventDateTime(event) : new Date(FALLBACK_EVENT_DATE_TIME);
  const archiveOpen = settings?.archive_enabled ?? Date.now() >= dateSource.getTime();

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>{settings?.page_eyebrow || "Pós-festa"}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-7xl mb-4">{settings?.page_title || "Memórias do reencontro"}</DisplayTitle>
        {loading && <LoadingState message="Carregando acervo..." />}
        {error && <ErrorState message={error} />}

        {!loading && !archiveOpen && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 md:p-12">
            <div className="max-w-3xl">
              <StatusBadge status="closed" />
              <h2 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl md:text-5xl font-bold mt-5 mb-4">{settings?.closed_title || "O acervo será aberto depois do reencontro."}</h2>
              <p className="text-[#8ab89a] leading-relaxed mb-8">{settings?.closed_text || "Depois do evento, esta página reunirá os registros e lembranças aprovados pela organização."}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  ["Fotos oficiais", "Seleção da organização"],
                  ["Memórias", "Relatos aprovados da turma"],
                  ["Melhores momentos", "Vídeo e destaques pós-evento"],
                ].map(([title, body]) => <div key={title} className="bg-[#0a120a] border border-[#2d6a4f]/20 p-5"><p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-2">{title}</p><p className="text-[#7a9a7a] text-sm">{body}</p></div>)}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Btn onClick={() => navigate("tickets")}><CreditCard size={16} />Comprar ingresso</Btn>
                <Btn variant="outline" onClick={() => navigate("photo-wall")}><Camera size={16} />Ver fotos antigas</Btn>
                <Btn variant="ghost" onClick={() => navigate("memories")}><MessageCircle size={16} />Ver memórias</Btn>
              </div>
            </div>
          </div>
        )}

        {!loading && archiveOpen && (
          <div className="flex flex-col gap-10">
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
              <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">{settings?.message_label || "Mensagem da organização"}</p>
              <p className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl leading-relaxed">
                {settings?.post_event_text?.trim() || "Obrigado por fazer parte deste reencontro. Este acervo preserva os registros da noite e as lembrancas que a turma escolheu dividir."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
