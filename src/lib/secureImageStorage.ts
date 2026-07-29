import { prepareImageForUpload, type PrepareImageOptions } from "./imageUploadSecurity";
import { supabase } from "./supabase";
import type { DbPhoto } from "./photo.types";

const FUNCTION_NAME = "photo-storage";

const ERROR_MESSAGES: Record<string, string> = {
  authentication_required: "Entre novamente para enviar a imagem.",
  image_required: "Selecione uma imagem.",
  photo_authorization_required: "Confirme a autorização para enviar a foto.",
  image_type_not_allowed: "Use uma imagem JPEG, PNG ou WebP.",
  image_signature_invalid: "O conteúdo do arquivo não corresponde a uma imagem válida.",
  image_mime_mismatch: "O tipo declarado não corresponde ao conteúdo real do arquivo.",
  image_sensitive_metadata_detected: "A imagem ainda contém metadados sensíveis.",
  image_markup_detected: "O arquivo contém marcação ou conteúdo executável não permitido.",
  image_trailing_data_detected: "O arquivo contém dados adicionais não permitidos.",
  image_dimensions_exceeded: "A imagem possui dimensões acima do limite permitido.",
  image_too_large: "A imagem ultrapassa o tamanho permitido.",
  duplicate_photo_content: "Esta mesma imagem já foi enviada.",
  rate_limit_exceeded: "Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.",
  storage_upload_failed: "O Storage não conseguiu receber a imagem.",
  storage_delete_failed: "A foto foi ocultada, mas a exclusão física do arquivo precisa ser tentada novamente.",
  admin_required: "Esta operação exige perfil administrativo.",
};

async function authorizationHeader() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error(ERROR_MESSAGES.authentication_required);
  return `Bearer ${data.session.access_token}`;
}

async function invoke(action: string, body: BodyInit, contentType?: string) {
  const url = `${String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, "")}/functions/v1/${FUNCTION_NAME}?action=${encodeURIComponent(action)}`;
  const headers = new Headers({
    Authorization: await authorizationHeader(),
    apikey: String(import.meta.env.VITE_SUPABASE_ANON_KEY),
  });
  if (contentType) headers.set("Content-Type", contentType);

  const response = await fetch(url, { method: "POST", headers, body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(payload?.error ?? "secure_storage_request_failed");
    throw new Error(ERROR_MESSAGES[code] ?? code);
  }
  return payload;
}

export interface SecurePhotoUploadInput {
  file: File;
  eventId: string;
  caption?: string | null;
  yearApprox?: number | null;
  locationText?: string | null;
  tags?: Array<{ personId: string; name: string }>;
  authorizationGiven: boolean;
}

export async function uploadSecurePhoto(input: SecurePhotoUploadInput): Promise<DbPhoto> {
  const prepared = await prepareImageForUpload(input.file, {
    maxInputBytes: 10 * 1024 * 1024,
    maxOutputBytes: 8 * 1024 * 1024,
    maxDimension: 4096,
    maxPixels: 16_000_000,
    outputMimeType: "image/webp",
  });
  const form = new FormData();
  form.set("file", prepared.file);
  form.set("event_id", input.eventId);
  form.set("caption", input.caption?.trim() ?? "");
  form.set("year_approx", input.yearApprox ? String(input.yearApprox) : "");
  form.set("location_text", input.locationText?.trim() ?? "");
  form.set("tags", JSON.stringify(input.tags ?? []));
  form.set("authorization_given", String(input.authorizationGiven));
  const payload = await invoke("upload", form);
  return payload.photo as DbPhoto;
}

export type SecureAssetTarget = "avatar" | "cms";

export async function uploadSecureAsset(
  file: File,
  target: SecureAssetTarget,
  scope: string,
  eventId?: string,
  options: PrepareImageOptions = {},
): Promise<{ storagePath: string; publicUrl: string }> {
  const prepared = await prepareImageForUpload(file, {
    maxInputBytes: target === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024,
    maxOutputBytes: target === "avatar" ? 4 * 1024 * 1024 : 8 * 1024 * 1024,
    maxDimension: target === "avatar" ? 2048 : 4096,
    maxPixels: target === "avatar" ? 4_000_000 : 16_000_000,
    outputMimeType: "image/webp",
    ...options,
  });
  const form = new FormData();
  form.set("file", prepared.file);
  form.set("target", target);
  form.set("scope", scope);
  if (eventId) form.set("event_id", eventId);
  const payload = await invoke("asset", form);
  return { storagePath: payload.storage.path, publicUrl: payload.storage.public_url };
}

export async function removeSecurePhoto(requestId: string, notes?: string | null) {
  return invoke("remove", JSON.stringify({ request_id: requestId, notes: notes ?? null }), "application/json");
}
