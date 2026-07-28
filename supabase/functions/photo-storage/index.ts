import { createClient } from "jsr:@supabase/supabase-js@2";
import { ImageSecurityError, inspectImageBytes } from "../_shared/image-security.ts";

const siteUrl = Deno.env.get("SITE_URL") ?? "https://hc20anos.com.br";
const corsHeaders = {
  "Access-Control-Allow-Origin": siteUrl,
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredEnvironment() {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) throw new Error("server_configuration_missing");
  return { url, anon, service };
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map(value => value.toString(16).padStart(2, "0")).join("");
}

function safeName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "image";
}

function parseTags(value: FormDataEntryValue | null) {
  if (!value) return [];
  if (typeof value !== "string") throw new Error("invalid_photo_tags");
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length > 20) throw new Error("invalid_photo_tags");
  return parsed.map(item => ({
    person_id: String(item?.personId ?? item?.person_id ?? ""),
    name: String(item?.name ?? ""),
  })).filter(item => item.person_id && item.name);
}

async function authenticate(request: Request) {
  const env = requiredEnvironment();
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new Error("authentication_required");
  const userClient = createClient(env.url, env.anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new Error("authentication_required");
  const serviceClient = createClient(env.url, env.service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { user: data.user, userClient, serviceClient };
}

function inspectFile(file: File, maxBytes: number) {
  return file.arrayBuffer().then(buffer => {
    const bytes = new Uint8Array(buffer);
    const inspection = inspectImageBytes(bytes, {
      declaredMimeType: file.type,
      maxBytes,
      maxDimension: 12_000,
      maxPixels: 40_000_000,
      rejectSensitiveMetadata: true,
    });
    return { bytes, inspection };
  });
}

async function uploadPhoto(request: Request) {
  const { user, userClient, serviceClient } = await authenticate(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "image_required" }, 400);
  const authorizationGiven = String(form.get("authorization_given") ?? "") === "true";
  if (!authorizationGiven) return json({ error: "photo_authorization_required" }, 400);

  let inspected;
  try {
    inspected = await inspectFile(file, 10 * 1024 * 1024);
  } catch (error) {
    const code = error instanceof ImageSecurityError ? error.code : "image_validation_failed";
    return json({ error: code }, 400);
  }
  const { bytes, inspection } = inspected;

  let tags;
  try {
    tags = parseTags(form.get("tags"));
  } catch {
    return json({ error: "invalid_photo_tags" }, 400);
  }

  const eventId = String(form.get("event_id") ?? "");
  if (!eventId) return json({ error: "event_id_required" }, 400);
  const digest = hex(await crypto.subtle.digest("SHA-256", bytes));
  const storagePath = `${user.id}/${crypto.randomUUID()}.${inspection.extension}`;

  const { error: uploadError } = await serviceClient.storage.from("photos").upload(storagePath, bytes, {
    contentType: inspection.mimeType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return json({ error: "storage_upload_failed", detail: uploadError.message }, 502);

  const { data: photo, error: createError } = await userClient.rpc("create_uploaded_photo", {
    p_event_id: eventId,
    p_storage_path: storagePath,
    p_original_file_name: file.name,
    p_content_type: inspection.mimeType,
    p_file_size_bytes: bytes.length,
    p_content_sha256: digest,
    p_image_width: inspection.width,
    p_image_height: inspection.height,
    p_caption: String(form.get("caption") ?? "") || null,
    p_year_approx: form.get("year_approx") ? Number(form.get("year_approx")) : null,
    p_location_text: String(form.get("location_text") ?? "") || null,
    p_tags: tags,
    p_authorization_given: true,
  });

  if (createError || !photo) {
    await serviceClient.storage.from("photos").remove([storagePath]);
    const code = String(createError?.message ?? "photo_record_creation_failed").includes("duplicate_photo_content")
      ? "duplicate_photo_content"
      : String(createError?.message ?? "photo_record_creation_failed");
    return json({ error: code }, code === "duplicate_photo_content" ? 409 : 400);
  }

  const { data: signed, error: signedError } = await serviceClient.storage.from("photos").createSignedUrl(storagePath, 3600);
  if (signedError) return json({ error: "signed_url_failed", detail: signedError.message }, 500);

  return json({
    photo: { ...photo, image_url: signed.signedUrl, thumbnail_url: signed.signedUrl },
    storage: {
      path: storagePath,
      content_type: inspection.mimeType,
      size: bytes.length,
      width: inspection.width,
      height: inspection.height,
      sha256: digest,
      metadata_stripped: true,
    },
  }, 201);
}

async function uploadAsset(request: Request) {
  const { user, serviceClient } = await authenticate(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "image_required" }, 400);
  const target = String(form.get("target") ?? "");
  const scope = safeName(String(form.get("scope") ?? "image"));
  const eventId = safeName(String(form.get("event_id") ?? "default"));
  if (!['avatar', 'cms'].includes(target)) return json({ error: "invalid_asset_target" }, 400);

  if (target === "cms") {
    const { data: admin } = await serviceClient.from("admin_users").select("id").eq("user_id", user.id).in("role", ["admin", "superadmin"]).maybeSingle();
    if (!admin) return json({ error: "admin_required" }, 403);
  }

  let inspected;
  try {
    inspected = await inspectFile(file, target === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024);
  } catch (error) {
    const code = error instanceof ImageSecurityError ? error.code : "image_validation_failed";
    return json({ error: code }, 400);
  }
  const { bytes, inspection } = inspected;
  const bucket = target === "avatar" ? "avatars" : "cms-assets";
  const prefix = target === "avatar" ? user.id : eventId;
  const storagePath = `${prefix}/${scope}-${crypto.randomUUID()}.${inspection.extension}`;

  const { error: uploadError } = await serviceClient.storage.from(bucket).upload(storagePath, bytes, {
    contentType: inspection.mimeType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return json({ error: "storage_upload_failed", detail: uploadError.message }, 502);
  const { data } = serviceClient.storage.from(bucket).getPublicUrl(storagePath);
  return json({ storage: { path: storagePath, public_url: data.publicUrl, content_type: inspection.mimeType, size: bytes.length } }, 201);
}

async function removePhoto(request: Request) {
  const { userClient, serviceClient } = await authenticate(request);
  const body = await request.json().catch(() => ({}));
  const requestId = String(body.request_id ?? "");
  const notes = String(body.notes ?? "") || null;
  if (!requestId) return json({ error: "request_id_required" }, 400);

  const { data: preparedRows, error: prepareError } = await userClient.rpc("prepare_photo_removal", {
    p_request_id: requestId,
    p_notes: notes,
  });
  const prepared = Array.isArray(preparedRows) ? preparedRows[0] : preparedRows;
  if (prepareError || !prepared) {
    const message = String(prepareError?.message ?? "removal_request_not_found");
    return json({ error: message }, message.includes("admin_required") ? 403 : 400);
  }

  let storageError: string | null = null;
  if (prepared.storage_path) {
    const { error } = await serviceClient.storage.from("photos").remove([prepared.storage_path]);
    storageError = error?.message ?? null;
  }

  const { data: completed, error: completeError } = await serviceClient.rpc("complete_photo_removal", {
    p_request_id: requestId,
    p_success: !storageError,
    p_error: storageError,
  });
  if (completeError) return json({ error: completeError.message }, 500);
  if (storageError) return json({ error: "storage_delete_failed", detail: storageError, request: completed }, 502);
  return json({ request: completed, photo_id: prepared.photo_id, storage_deleted: Boolean(prepared.storage_path) });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const action = new URL(request.url).searchParams.get("action") ?? "upload";
    if (action === "upload") return await uploadPhoto(request);
    if (action === "asset") return await uploadAsset(request);
    if (action === "remove") return await removePhoto(request);
    return json({ error: "invalid_action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    const status = message === "authentication_required" ? 401 : message === "server_configuration_missing" ? 500 : 400;
    return json({ error: message }, status);
  }
});
