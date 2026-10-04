import { supabase } from "./supabase";
import { withFallback } from "./serviceFallback";
import type { DbEventArchiveSettings } from "./content.types";

export async function getEventArchiveSettings(eventId: string): Promise<DbEventArchiveSettings | null> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("event_archive_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data as DbEventArchiveSettings | null;
  }, null);
}

export async function updateEventArchiveSettings(
  eventId: string,
  patch: Partial<DbEventArchiveSettings>,
): Promise<DbEventArchiveSettings> {
  const payload = {
    event_id: eventId,
    archive_enabled: patch.archive_enabled ?? false,
    page_eyebrow: patch.page_eyebrow ?? "Pós-festa",
    page_title: patch.page_title ?? "Memórias do reencontro",
    message_label: patch.message_label ?? "Mensagem da organização",
    closed_title: patch.closed_title ?? "O acervo será aberto depois do reencontro.",
    closed_text: patch.closed_text ?? "Depois do evento, esta página reunirá os registros e lembranças aprovados pela organização.",
    post_event_text: patch.post_event_text ?? null,
    official_video_url: patch.official_video_url ?? null,
    official_video_title: patch.official_video_title ?? null,
    official_photo_ids: patch.official_photo_ids ?? [],
    highlight_photo_ids: patch.highlight_photo_ids ?? [],
    highlights_links: patch.highlights_links ?? [],
  };
  const { data, error } = await (supabase as any)
    .from("event_archive_settings")
    .upsert(payload, { onConflict: "event_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as DbEventArchiveSettings;
}
