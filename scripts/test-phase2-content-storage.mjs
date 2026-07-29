import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "00000000-0000-0000-0000-000000000001";
const PASSWORD = "phase1-local-test-password";
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));

function parseEnv(output) {
  return Object.fromEntries(output.split(/\r?\n/).map(line => line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)).filter(Boolean).map(match => [match[1], match[2].replace(/"$/, "")]));
}

const env = parseEnv(execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8" }));
const apiUrl = env.API_URL;
const anonKey = env.ANON_KEY;
const serviceKey = env.SERVICE_ROLE_KEY;
assert.ok(apiUrl && anonKey && serviceKey, "Supabase local não forneceu API_URL, ANON_KEY e SERVICE_ROLE_KEY");
const functionUrl = `${apiUrl}/functions/v1/photo-storage`;

const anonymous = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
const service = createClient(apiUrl, serviceKey, { auth: { persistSession: false } });

async function waitForLocalAuth() {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}/auth/v1/health`, { headers: { apikey: anonKey } });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      lastStatus = 0;
    }
    await delay(1000);
  }
  throw new Error(`Supabase Auth local não ficou saudável; último status: ${lastStatus || "indisponível"}`);
}

async function signedClient(email) {
  const client = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
  let lastError = null;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (!error) {
      assert.ok(data.session?.access_token, `Sessão não criada para ${email}`);
      return { client, token: data.session.access_token };
    }
    lastError = error;
    const retryable = error.name === "AuthRetryableFetchError" || Number(error.status) >= 500;
    if (!retryable || attempt === 10) break;
    await delay(attempt * 500);
  }
  assert.ifError(lastError);
}

async function functionRequest(token, action, body, contentType) {
  const headers = { Authorization: `Bearer ${token}`, apikey: anonKey };
  if (contentType) headers["Content-Type"] = contentType;
  const response = await fetch(`${functionUrl}?action=${action}`, { method: "POST", headers, body });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function photoForm(file, extras = {}) {
  const form = new FormData();
  form.set("file", file);
  form.set("event_id", EVENT_ID);
  form.set("caption", extras.caption ?? "Foto <b>segura</b>");
  form.set("year_approx", "2006");
  form.set("location_text", extras.location ?? "Pátio <script>alert(1)</script> do colégio");
  form.set("tags", JSON.stringify(extras.tags ?? []));
  form.set("authorization_given", "true");
  return form;
}

function metadataPng() {
  const iendOffset = PNG.length - 12;
  const chunk = new Uint8Array(16);
  new DataView(chunk.buffer).setUint32(0, 4, false);
  chunk.set(Buffer.from("tEXt"), 4);
  chunk.set(Buffer.from("EXIF"), 8);
  return new Uint8Array([...PNG.slice(0, iendOffset), ...chunk, ...PNG.slice(iendOffset)]);
}

async function expectFunctionError(token, file, expected) {
  const { response, payload } = await functionRequest(token, "upload", photoForm(file));
  assert.equal(response.ok, false, `Arquivo inválido foi aceito: ${expected}`);
  assert.equal(payload.error, expected);
}

await waitForLocalAuth();
const ordinary = await signedClient("authenticated-tests@local.invalid");
const moderator = await signedClient("moderator-tests@local.invalid");
const admin = await signedClient("admin-tests@local.invalid");

console.log("1. Políticas bloqueiam upload direto ao bucket privado");
const directPath = "22222222-2222-4222-8222-222222222222/direct-upload.png";
const direct = await ordinary.client.storage.from("photos").upload(directPath, PNG, { contentType: "image/png" });
assert.ok(direct.error, "Upload direto deveria ser bloqueado");

console.log("2. Assinatura, MIME, EXIF, markup e limites são validados pela Edge Function");
await expectFunctionError(ordinary.token, new File([PNG], "mismatch.jpg", { type: "image/jpeg" }), "image_mime_mismatch");
await expectFunctionError(ordinary.token, new File([metadataPng()], "exif.png", { type: "image/png" }), "image_sensitive_metadata_detected");
await expectFunctionError(ordinary.token, new File(['<svg><script>alert(1)</script></svg>'], "malicious.png", { type: "image/png" }), "image_markup_detected");
await expectFunctionError(ordinary.token, new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }), "image_too_large");

console.log("3. Upload real, deduplicação concorrente e criação de tags pending");
const { data: person } = await service.from("people").select("id,full_name").limit(1).single();
assert.ok(person?.id);
const concurrent = await Promise.all(Array.from({ length: 3 }, (_, index) => functionRequest(
  ordinary.token,
  "upload",
  photoForm(new File([PNG], `same-${index}.png`, { type: "image/png" }), { tags: [{ personId: person.id, name: `${person.full_name}<script>x</script>` }] }),
)));
const successes = concurrent.filter(item => item.response.status === 201);
const duplicates = concurrent.filter(item => item.response.status === 409 && item.payload.error === "duplicate_photo_content");
assert.equal(successes.length, 1, JSON.stringify(concurrent.map(item => ({ status: item.response.status, payload: item.payload }))));
assert.equal(duplicates.length, 2);
const photo = successes[0].payload.photo;
assert.equal(photo.status, "pending");
assert.equal(photo.metadata_stripped, true);
assert.equal(photo.caption, "Foto segura");
assert.equal(photo.location_text, "Pátio do colégio");
assert.ok(photo.storage_path.startsWith("22222222-2222-4222-8222-222222222222/"));
const listed = await service.storage.from("photos").list("22222222-2222-4222-8222-222222222222");
assert.ifError(listed.error);
assert.equal(listed.data.filter(item => item.name).length, 1, "Uploads duplicados deixaram objetos órfãos");
const tagRows = await service.from("photo_tags").select("*").eq("photo_id", photo.id);
assert.ifError(tagRows.error);
assert.equal(tagRows.data.length, 1);
assert.equal(tagRows.data[0].status, "pending");
assert.equal(tagRows.data[0].tagged_name_snapshot, person.full_name);

console.log("4. Moderação por role, histórico e transição concorrente");
const approved = await moderator.client.rpc("moderate_content_item", { p_entity_type: "photo", p_entity_id: photo.id, p_status: "approved", p_notes: "Aprovada em teste" });
assert.ifError(approved.error);
const forbiddenRemoval = await moderator.client.rpc("prepare_photo_removal", { p_request_id: "00000000-0000-0000-0000-000000000000", p_notes: null });
assert.match(forbiddenRemoval.error?.message ?? "", /admin_required/);
const tag = tagRows.data[0];
assert.ifError((await moderator.client.rpc("moderate_content_item", { p_entity_type: "photo_tag", p_entity_id: tag.id, p_status: "approved", p_notes: null })).error);
const duplicateApprovedTag = await ordinary.client.rpc("submit_photo_tag", {
  p_photo_id: photo.id,
  p_person_id: person.id,
  p_tagged_name: "Nome alterado indevidamente",
});
assert.ifError(duplicateApprovedTag.error);
assert.equal(duplicateApprovedTag.data.id, tag.id);
const tagAfterDuplicate = await service.from("photo_tags").select("status,tagged_name_snapshot").eq("id", tag.id).single();
assert.ifError(tagAfterDuplicate.error);
assert.equal(tagAfterDuplicate.data.status, "approved");
assert.equal(tagAfterDuplicate.data.tagged_name_snapshot, person.full_name);

const memorySubmit = await ordinary.client.rpc("submit_memory", {
  p_event_id: EVENT_ID,
  p_person_id: null,
  p_memory_text: "<script>alert(1)</script> Uma memória <b>segura</b> da turma.",
  p_is_anonymous: true,
});
assert.ifError(memorySubmit.error);
assert.equal(memorySubmit.data.memory_text, "Uma memória segura da turma.");
assert.equal(memorySubmit.data.is_anonymous, true);
assert.equal(memorySubmit.data.status, "pending");
const decisions = await Promise.all([
  moderator.client.rpc("moderate_content_item", { p_entity_type: "memory", p_entity_id: memorySubmit.data.id, p_status: "approved", p_notes: "decisão A" }),
  moderator.client.rpc("moderate_content_item", { p_entity_type: "memory", p_entity_id: memorySubmit.data.id, p_status: "rejected", p_notes: "decisão B" }),
]);
assert.equal(decisions.filter(result => !result.error).length, 1, "Duas decisões concorrentes foram aceitas");
assert.equal(decisions.filter(result => result.error && /content_already_moderated/.test(result.error.message)).length, 1);
const publicMemories = await anonymous.rpc("get_public_memories", { p_event_id: EVENT_ID, p_featured_only: false });
assert.ifError(publicMemories.error);
const publicMemory = publicMemories.data.find(row => row.id === memorySubmit.data.id);
if (decisions[0].error === null || decisions[1].error === null) {
  const persisted = await service.from("memories").select("status").eq("id", memorySubmit.data.id).single();
  if (persisted.data.status === "approved") {
    assert.ok(publicMemory);
    assert.equal(publicMemory.author_name, null);
    assert.equal(publicMemory.user_id, null);
    assert.equal(publicMemory.person_id, null);
  }
}

console.log("5. Sanitização e rate limiting sob concorrência");
const initialComment = await ordinary.client.rpc("submit_photo_comment", { p_photo_id: photo.id, p_comment_text: "<img src=x onerror=alert(1)> Comentário <b>seguro</b>" });
assert.ifError(initialComment.error);
assert.equal(initialComment.data.comment_text, "Comentário seguro");
const commentBurst = await Promise.all(Array.from({ length: 12 }, (_, index) => ordinary.client.rpc("submit_photo_comment", {
  p_photo_id: photo.id,
  p_comment_text: `Comentário concorrente ${index}`,
})));
const rateLimited = commentBurst.filter(result => /rate_limit_exceeded/.test(result.error?.message ?? ""));
assert.ok(rateLimited.length >= 3, `Rate limit insuficiente: ${rateLimited.length}`);
const bucket = await service.from("rate_limit_buckets").select("request_count").eq("action", "photo_comment").eq("actor_user_id", "22222222-2222-4222-8222-222222222222").single();
assert.ifError(bucket.error);
assert.equal(bucket.data.request_count, 10);

console.log("6. Remoção concorrente é idempotente e apaga o objeto físico");
const removalAttempts = await Promise.all(Array.from({ length: 3 }, () => ordinary.client.rpc("submit_photo_removal_request", {
  p_photo_id: photo.id,
  p_requester_name: "Solicitante <script>x</script>",
  p_requester_email: "TESTE@LOCAL.INVALID",
  p_reason: "Solicito a remoção desta foto por motivo de privacidade.",
})));
removalAttempts.forEach(result => assert.ifError(result.error));
const removalIds = new Set(removalAttempts.map(result => result.data.id));
assert.equal(removalIds.size, 1, "Solicitações concorrentes criaram registros diferentes");
const removal = removalAttempts[0];
const removalRows = await service.from("photo_removal_requests").select("id").eq("photo_id", photo.id).eq("requester_user_id", "22222222-2222-4222-8222-222222222222").in("status", ["pending", "hidden_preventively"]);
assert.ifError(removalRows.error);
assert.equal(removalRows.data.length, 1);
const removed = await functionRequest(admin.token, "remove", JSON.stringify({ request_id: removal.data.id, notes: "Remoção integrada" }), "application/json");
assert.equal(removed.response.ok, true, JSON.stringify(removed.payload));
const [photoAfter, requestAfter, commentsAfter, tagsAfter, eventsAfter, objectsAfter] = await Promise.all([
  service.from("photos").select("status,removed_at").eq("id", photo.id).single(),
  service.from("photo_removal_requests").select("status,storage_deleted_at,removal_error").eq("id", removal.data.id).single(),
  service.from("photo_comments").select("status").eq("photo_id", photo.id),
  service.from("photo_tags").select("status").eq("photo_id", photo.id),
  service.from("content_moderation_events").select("id").in("entity_id", [photo.id, removal.data.id]),
  service.storage.from("photos").list("22222222-2222-4222-8222-222222222222"),
]);
assert.ifError(photoAfter.error);
assert.ifError(requestAfter.error);
assert.ifError(commentsAfter.error);
assert.ifError(tagsAfter.error);
assert.ifError(eventsAfter.error);
assert.ifError(objectsAfter.error);
assert.equal(photoAfter.data.status, "removed");
assert.ok(photoAfter.data.removed_at);
assert.equal(requestAfter.data.status, "approved");
assert.ok(requestAfter.data.storage_deleted_at);
assert.equal(requestAfter.data.removal_error, null);
assert.ok(commentsAfter.data.every(row => row.status === "hidden"));
assert.ok(tagsAfter.data.every(row => row.status === "removed"));
assert.ok(eventsAfter.data.length >= 2);
assert.equal(objectsAfter.data.filter(item => item.name).length, 0);

console.log("7. Asset público passa pela mesma validação binária");
const assetForm = new FormData();
assetForm.set("file", new File([PNG], "logo.png", { type: "image/png" }));
assetForm.set("target", "cms");
assetForm.set("scope", "phase2-logo");
assetForm.set("event_id", EVENT_ID);
const asset = await functionRequest(admin.token, "asset", assetForm);
assert.equal(asset.response.status, 201, JSON.stringify(asset.payload));
assert.match(asset.payload.storage.public_url, /cms-assets/);
const assetDownload = await fetch(asset.payload.storage.public_url);
assert.equal(assetDownload.ok, true);
await service.storage.from("cms-assets").remove([asset.payload.storage.path]);

console.log("Phase 2 integration: PASS");
