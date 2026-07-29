import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const ROOT = process.cwd();
const CHECK = process.argv.includes("--check");
const changed = [];

async function update(relative, transform) {
  const absolute = path.join(ROOT, relative);
  const current = await readFile(absolute, "utf8");
  const next = transform(current);
  if (next === current) return;
  if (CHECK) throw new Error(`${relative} precisa das transformações da Fase 2`);
  await writeFile(absolute, next, "utf8");
  changed.push(relative);
}

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Bloco não encontrado: ${label}`);
  return source.replace(before, after);
}

function replaceFunction(source, name, replacement, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let target;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) target = node;
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!target) {
    if (source.includes(replacement.trim())) return source;
    throw new Error(`Função não encontrada: ${name} em ${fileName}`);
  }
  return `${source.slice(0, target.getStart(sourceFile))}${replacement.trim()}${source.slice(target.end)}`;
}

await update("supabase/migrations/20260728000001_phase2_content_storage_security.sql", source => {
  let next = source.replace("foreach_table:\n", "");
  next = next.replaceAll("select r.*,p.event_id into v_row,v_event_id", "select r,p.event_id into v_row,v_event_id");
  next = next.replace(
    "alter table public.photos add constraint photos_authorization_required check (authorization_given = true);",
    "alter table public.photos add constraint photos_authorization_required check (storage_path is null or authorization_given = true);",
  );
  const policyMarker = "update storage.buckets\nset allowed_mime_types = array['image/jpeg','image/png','image/webp']\nwhere id in ('avatars', 'cms-assets');";
  const hardened = `${policyMarker}\n\n-- Direct uploads to public asset buckets are also centralized in the Edge Function.\ndrop policy if exists \"avatars_owner_upload\" on storage.objects;\ndrop policy if exists \"avatars_owner_update\" on storage.objects;\ndrop policy if exists \"cms_assets_storage_admin_write\" on storage.objects;`;
  if (!next.includes("Direct uploads to public asset buckets")) next = replaceRequired(next, policyMarker, hardened, "políticas de asset storage");
  return next;
});

await update("src/app/App.tsx", source => replaceRequired(
  source,
  `            <label className="flex items-center justify-between cursor-pointer border border-[#2d6a4f]/20 p-4 bg-[#0a120a]">\n              <span className="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>\n              <button onClick={() => setIsAnonymous(v => !v)} className={\`relative w-12 h-6 transition-colors \${isAnonymous ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}\`}>\n                <div className={\`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all \${isAnonymous ? "left-7" : "left-1"}\`} />\n              </button>\n            </label>`,
  `            <div className="flex items-center justify-between border border-[#2d6a4f]/20 p-4 bg-[#0a120a]">\n              <span id="memory-anonymity-label" className="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>\n              <button\n                type="button"\n                role="switch"\n                aria-labelledby="memory-anonymity-label"\n                aria-checked={isAnonymous}\n                onClick={() => setIsAnonymous(value => !value)}\n                className={\`relative w-12 h-6 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c] \${isAnonymous ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}\`}\n              >\n                <span aria-hidden="true" className={\`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all \${isAnonymous ? "left-7" : "left-1"}\`} />\n              </button>\n            </div>`,
  "controle canônico de anonimato",
));

await update("src/historyContentEnhancements.ts", source => replaceFunction(source, "enhanceMemoriesForm", `
function enhanceMemoriesForm() {
  if ((window.location.pathname.replace(/\\/+$/, "") || "/") !== "/nossa-historia/memorias") return;
  const sectionLabel = Array.from(document.querySelectorAll<HTMLElement>("p"))
    .find(element => normalizeText(element.textContent) === "enviar memória");
  const formCard = sectionLabel?.parentElement;
  if (!formCard) return;
  Array.from(formCard.querySelectorAll<HTMLButtonElement>("button"))
    .filter(button => normalizeText(button.textContent) === "enviar para moderação")
    .forEach(button => replaceButtonLabel(button, "Enviar"));
}
`, "historyContentEnhancements.ts"));

await update("src/lib/services.ts", source => {
  let next = source;
  if (!next.includes('from "./secureImageStorage"')) {
    next = next.replace(
      'import { DEV_MODE, supabase } from "./supabase";',
      'import { DEV_MODE, supabase } from "./supabase";\nimport { removeSecurePhoto, uploadSecureAsset, uploadSecurePhoto } from "./secureImageStorage";',
    );
  }
  const marker = 'const FUNCTIONS_BASE_URL = `${(import.meta.env.VITE_SUPABASE_URL as string).replace(/\\\/$/, "")}/functions/v1/server/make-server-62fab262`;';
  const helper = `async function hydratePhotoUrls<T extends DbPhoto>(photos: T[]): Promise<T[]> {\n  const paths = Array.from(new Set(photos.map(photo => photo.storage_path).filter((value): value is string => Boolean(value))));\n  if (!paths.length) return photos;\n  const { data, error } = await supabase.storage.from("photos").createSignedUrls(paths, 3600);\n  if (error) throw error;\n  const urls = new Map((data ?? []).filter(item => item.signedUrl).map(item => [item.path, item.signedUrl]));\n  return photos.map(photo => {\n    const signedUrl = photo.storage_path ? urls.get(photo.storage_path) : null;\n    return signedUrl ? { ...photo, image_url: signedUrl, thumbnail_url: signedUrl } : photo;\n  });\n}\n\n${marker}`;
  if (!next.includes("async function hydratePhotoUrls")) next = replaceRequired(next, marker, helper, "hidratação de URLs privadas");

  next = replaceFunction(next, "uploadCmsContentImage", `
export async function uploadCmsContentImage(file: File, adminId: string, scope: string): Promise<string> {
  const uploaded = await uploadSecureAsset(file, "cms", scope, DEFAULT_HOME_EVENT_ID);
  await writeAudit("upload_cms_content_image", "cms_asset", DEFAULT_HOME_EVENT_ID, { path: uploaded.storagePath, scope, admin_id: adminId }).catch(() => {});
  return uploaded.publicUrl;
}
`, "services.ts");
  next = replaceFunction(next, "uploadProfileAvatar", `
export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  return (await uploadSecureAsset(file, "avatar", "profile-avatar")).publicUrl;
}
`, "services.ts");
  next = replaceFunction(next, "uploadAdminPersonAvatar", `
export async function uploadAdminPersonAvatar(adminId: string, file: File, personId?: string | null): Promise<string> {
  return (await uploadSecureAsset(file, "avatar", \`admin-person-\${personId || adminId}\`)).publicUrl;
}
`, "services.ts");
  next = replaceFunction(next, "uploadHeaderLogo", `
export async function uploadHeaderLogo(file: File, adminId: string): Promise<string> {
  const uploaded = await uploadSecureAsset(file, "cms", "header-logo", DEFAULT_HOME_EVENT_ID, { maxOutputBytes: 2 * 1024 * 1024 });
  await writeAudit("upload_header_logo", "home_page_content", DEFAULT_HOME_EVENT_ID, { path: uploaded.storagePath, admin_id: adminId }).catch(() => {});
  return uploaded.publicUrl;
}
`, "services.ts");
  next = replaceFunction(next, "uploadFavicon", `
export async function uploadFavicon(file: File, adminId: string): Promise<string> {
  const uploaded = await uploadSecureAsset(file, "cms", "favicon", DEFAULT_HOME_EVENT_ID, { maxOutputBytes: 1024 * 1024, maxDimension: 512, maxPixels: 262144 });
  await writeAudit("upload_favicon", "home_page_content", DEFAULT_HOME_EVENT_ID, { path: uploaded.storagePath, admin_id: adminId }).catch(() => {});
  return uploaded.publicUrl;
}
`, "services.ts");
  next = replaceFunction(next, "getApprovedPhotos", `
export async function getApprovedPhotos(eventId?: string): Promise<DbPhoto[]> {
  return withFallback(async () => {
    let query = supabase.from("photos").select("*, photo_tags(person_id, tagged_name_snapshot, status)").eq("status", "approved").order("created_at", { ascending: false });
    if (eventId) query = query.eq("event_id", eventId);
    const { data, error } = await query;
    if (error) throw error;
    return hydratePhotoUrls((data as DbPhoto[]) ?? []);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "getMyUploadedPhotos", `
export async function getMyUploadedPhotos(userId: string): Promise<DbPhoto[]> {
  if (!userId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase.from("photos").select("*").eq("uploaded_by_user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return hydratePhotoUrls((data as DbPhoto[]) ?? []);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "getMyTaggedPhotos", `
export async function getMyTaggedPhotos(personId: string): Promise<DbPhoto[]> {
  if (!personId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase.from("photo_tags").select("*, photos(*)").eq("person_id", personId).eq("status", "approved").order("created_at", { ascending: false });
    if (error) throw error;
    const photos = ((data ?? []) as (DbPhotoTag & { photos?: DbPhoto | null })[]).map(row => row.photos).filter((photo): photo is DbPhoto => Boolean(photo));
    return hydratePhotoUrls(photos);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "getPendingPhotos", `
export async function getPendingPhotos(): Promise<DbPhoto[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("photos").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (error) throw error;
    return hydratePhotoUrls((data as DbPhoto[]) ?? []);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "uploadPhoto", `
export async function uploadPhoto(params: {
  file: File; userId: string; userName: string; caption: string; yearApprox: number;
  locationText: string; eventId: string; tags?: { personId: string; name: string }[];
}) {
  const photo = await uploadSecurePhoto({ file: params.file, eventId: params.eventId, caption: params.caption, yearApprox: params.yearApprox, locationText: params.locationText, tags: params.tags, authorizationGiven: true });
  await writeAudit("upload_photo", "photos", photo.id, { tags_count: params.tags?.length ?? 0, authorization_given: true });
  return photo;
}
`, "services.ts");
  next = replaceFunction(next, "moderatePhoto", `
export async function moderatePhoto(id: string, action: "approved" | "rejected", adminId: string) {
  const { error } = await supabase.rpc("moderate_content_item", { p_entity_type: "photo", p_entity_id: id, p_status: action, p_notes: null });
  if (error) throw error;
  await writeAudit(\`photo_\${action}\`, "photos", id, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "getPhotosForModeration", `
export async function getPhotosForModeration(status: "pending" | "approved" | "rejected" | "removed" | "all" = "pending"): Promise<DbPhoto[]> {
  return withFallback(async () => {
    let query = supabase.from("photos").select("*").order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return hydratePhotoUrls((data as DbPhoto[]) ?? []);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "moderateTag", `
export async function moderateTag(id: string, action: "approved" | "rejected", adminId: string) {
  const { error } = await supabase.rpc("moderate_content_item", { p_entity_type: "photo_tag", p_entity_id: id, p_status: action, p_notes: null });
  if (error) throw error;
  await writeAudit(\`tag_\${action}\`, "photo_tags", id, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "addPhotoTag", `
export async function addPhotoTag(photoId: string, personId: string, taggedName: string, userId: string) {
  const { error } = await supabase.rpc("submit_photo_tag", { p_photo_id: photoId, p_person_id: personId, p_tagged_name: taggedName });
  if (error && !String(error.message).includes("duplicate")) throw error;
}
`, "services.ts");
  next = replaceFunction(next, "createPhotoComment", `
export async function createPhotoComment(params: { photoId: string; userId: string; authorName: string; commentText: string; }): Promise<DbPhotoComment> {
  const { data, error } = await supabase.rpc("submit_photo_comment", { p_photo_id: params.photoId, p_comment_text: params.commentText });
  if (error) throw error;
  await writeAudit("create_photo_comment", "photo_comments", data.id, { photo_id: params.photoId });
  return data as DbPhotoComment;
}
`, "services.ts");
  next = replaceFunction(next, "moderatePhotoComment", `
export async function moderatePhotoComment(id: string, status: ModerationStatus, adminId: string): Promise<void> {
  const { error } = await supabase.rpc("moderate_content_item", { p_entity_type: "photo_comment", p_entity_id: id, p_status: status, p_notes: null });
  if (error) throw error;
  await writeAudit(\`photo_comment_\${status}\`, "photo_comments", id, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "getFeaturedOrPopularPhotos", `
export async function getFeaturedOrPopularPhotos(eventId = DEFAULT_EVENT_ID): Promise<DbPhoto[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("photos").select("*").eq("event_id", eventId).eq("status", "approved").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(12);
    if (error) throw error;
    return hydratePhotoUrls((data as DbPhoto[]) ?? []);
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "toggleFeaturedPhoto", `
export async function toggleFeaturedPhoto(photoId: string, featured: boolean, adminId: string): Promise<void> {
  const { error } = await supabase.rpc("set_content_featured", { p_entity_type: "photo", p_entity_id: photoId, p_featured: featured, p_notes: null });
  if (error) throw error;
  await writeAudit(featured ? "feature_photo" : "unfeature_photo", "photos", photoId, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "createMemory", `
export async function createMemory(params: { eventId: string; userId: string; personId?: string | null; authorName: string; memoryText: string; isAnonymous: boolean; }): Promise<DbMemory> {
  const { data, error } = await supabase.rpc("submit_memory", { p_event_id: params.eventId, p_person_id: params.personId ?? null, p_memory_text: params.memoryText, p_is_anonymous: params.isAnonymous });
  if (error) throw error;
  await writeAudit("create_memory", "memories", data.id, { is_anonymous: params.isAnonymous });
  return data as DbMemory;
}
`, "services.ts");
  next = replaceFunction(next, "getApprovedMemories", `
export async function getApprovedMemories(eventId = DEFAULT_EVENT_ID, featuredOnly = false): Promise<DbMemory[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.rpc("get_public_memories", { p_event_id: eventId, p_featured_only: featuredOnly });
    if (error) throw error;
    return (data as DbMemory[]) ?? [];
  }, []);
}
`, "services.ts");
  next = replaceFunction(next, "moderateMemory", `
export async function moderateMemory(id: string, status: ModerationStatus, adminId: string): Promise<void> {
  const { error } = await supabase.rpc("moderate_content_item", { p_entity_type: "memory", p_entity_id: id, p_status: status, p_notes: null });
  if (error) throw error;
  await writeAudit(\`memory_\${status}\`, "memories", id, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "toggleFeaturedMemory", `
export async function toggleFeaturedMemory(id: string, featured: boolean, adminId: string): Promise<void> {
  const { error } = await supabase.rpc("set_content_featured", { p_entity_type: "memory", p_entity_id: id, p_featured: featured, p_notes: null });
  if (error) throw error;
  await writeAudit(featured ? "feature_memory" : "unfeature_memory", "memories", id, { admin_id: adminId });
}
`, "services.ts");
  next = replaceFunction(next, "createPhotoRemovalRequest", `
export async function createPhotoRemovalRequest(params: { photoId: string; userId: string; requesterName: string; requesterEmail: string; reason: string; }) {
  const { data, error } = await supabase.rpc("submit_photo_removal_request", { p_photo_id: params.photoId, p_requester_name: params.requesterName, p_requester_email: params.requesterEmail, p_reason: params.reason });
  if (error) throw error;
  await writeAudit("create_photo_removal_request", "photo_removal_requests", data.id, { photo_id: params.photoId });
  return data as DbPhotoRemovalRequest;
}
`, "services.ts");
  next = replaceFunction(next, "reviewPhotoRemovalRequest", `
export async function reviewPhotoRemovalRequest(id: string, action: "approved" | "rejected" | "hidden_preventively", adminId: string, notes?: string) {
  if (action === "rejected") {
    const { error } = await supabase.rpc("reject_photo_removal_request", { p_request_id: id, p_notes: notes ?? null });
    if (error) throw error;
  } else {
    await removeSecurePhoto(id, notes ?? null);
  }
  await writeAudit(\`removal_request_\${action}\`, "photo_removal_requests", id, { admin_id: adminId, notes });
}
`, "services.ts");
  return next;
});

await update("src/lib/cmsAdmin.ts", source => {
  let next = source;
  if (!next.includes('from "./secureImageStorage"')) next = next.replace('import { supabase } from "./supabase";', 'import { supabase } from "./supabase";\nimport { uploadSecureAsset } from "./secureImageStorage";');
  return replaceFunction(next, "uploadCmsAssetFile", `
export async function uploadCmsAssetFile(file: File, assetKey: string, eventId = CMS_EVENT_ID) {
  const uploaded = await uploadSecureAsset(file, "cms", assetKey, eventId);
  return { storagePath: uploaded.storagePath, publicUrl: uploaded.publicUrl };
}
`, "cmsAdmin.ts");
});

await update("scripts/generate-database-contracts.mjs", source => {
  let next = source;
  next = replaceRequired(next, '  types: "docs/30-contratos/database.types.generated.ts",', '  types: "docs/30-contratos/database.types.generated.ts",\n  runtimeTypes: "src/lib/database.generated.ts",', "saída runtime de tipos");
  const writeLine = '  await writeOrCheck(OUTPUTS.types, `// Generated by npm run docs:generate-db-contracts\\n// Source commit: ${metadata.commit}\\n\\n${types}`);';
  const replacement = `${writeLine}\n  await writeOrCheck(OUTPUTS.runtimeTypes, \`// Generated by npm run docs:generate-db-contracts\\n// Source commit: \${metadata.commit}\\n\\n\${types}\`);`;
  return replaceRequired(next, writeLine, replacement, "gravação dos tipos runtime");
});

await update("package.json", source => {
  const data = JSON.parse(source);
  data.scripts["phase2:apply"] = "node scripts/apply-phase2-content-storage.mjs";
  data.scripts["phase2:check"] = "node scripts/apply-phase2-content-storage.mjs --check";
  data.scripts["test:image-security"] = "node --experimental-strip-types --test tests/unit/image-upload-security.test.mts";
  data.scripts["test:phase2:storage"] = "node scripts/test-phase2-content-storage.mjs";
  data.scripts["supabase:deploy:photo-storage"] = "supabase functions deploy photo-storage --no-verify-jwt --project-ref tjnqqsbwgjcdzcxykyif";
  return `${JSON.stringify(data, null, 2)}\n`;
});

const legacyPath = path.join(ROOT, "src/memoryAnonymityEnhancement.ts");
try {
  await readFile(legacyPath, "utf8");
  if (CHECK) throw new Error("src/memoryAnonymityEnhancement.ts ainda existe");
  await rm(legacyPath);
  changed.push("src/memoryAnonymityEnhancement.ts (removido)");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(changed.length ? `Fase 2 aplicada em ${changed.length} arquivo(s):\n${changed.join("\n")}` : "Fase 2 já está aplicada.");
