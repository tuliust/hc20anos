import { supabase } from "./supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export interface ContentModerationSettings {
  event_id: string;
  auto_approve_photos: boolean;
  auto_approve_comments: boolean;
  auto_approve_memories: boolean;
}

export async function getContentModerationSettings(eventId = DEFAULT_EVENT_ID): Promise<ContentModerationSettings> {
  const fallback: ContentModerationSettings = {
    event_id: eventId,
    auto_approve_photos: false,
    auto_approve_comments: false,
    auto_approve_memories: false,
  };
  const { data, error } = await (supabase as any)
    .from("content_moderation_settings")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) return fallback;
  return (data as ContentModerationSettings | null) ?? fallback;
}

export async function updateContentModerationSettings(
  eventId: string,
  patch: Partial<ContentModerationSettings>,
): Promise<ContentModerationSettings> {
  const { data, error } = await (supabase as any)
    .from("content_moderation_settings")
    .upsert({ event_id: eventId, ...patch }, { onConflict: "event_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as ContentModerationSettings;
}
