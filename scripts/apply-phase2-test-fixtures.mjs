import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK = process.argv.includes("--check");

async function update(relative, transform) {
  const absolute = path.join(ROOT, relative);
  const current = await readFile(absolute, "utf8");
  const next = transform(current);
  if (next === current) return false;
  if (CHECK) throw new Error(`${relative} precisa ser atualizado para as RPCs da Fase 2`);
  await writeFile(absolute, next, "utf8");
  console.log(`Atualizado: ${relative}`);
  return true;
}

function insertAfter(source, marker, addition, label) {
  if (source.includes(addition.trim())) return source;
  if (!source.includes(marker)) throw new Error(`Marcador não encontrado: ${label}`);
  return source.replace(marker, `${marker}${addition}`);
}

await update("tests/e2e/engagement-fixtures.ts", source => {
  let next = source;
  const marker = "    const method = request.method();\n";
  const addition = `\n    if (restPath === "rpc/get_public_memories" && method === "POST") {\n      await fulfillJson(route, approvedMemories.map(memory => ({\n        ...memory,\n        user_id: null,\n        person_id: null,\n        author_name: memory.is_anonymous ? null : memory.author_name,\n      })));\n      return;\n    }\n\n    if (restPath === "rpc/submit_memory" && method === "POST") {\n      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;\n      const mapped = {\n        event_id: body.p_event_id,\n        user_id: TEST_USER_ID,\n        person_id: body.p_person_id ?? null,\n        author_name: "Maria Cabeção",\n        memory_text: body.p_memory_text,\n        is_anonymous: Boolean(body.p_is_anonymous),\n        status: "pending",\n        is_featured: false,\n      };\n      memoryCalls.push(mapped);\n      await fulfillJson(route, {\n        id: "00000000-0000-4000-8000-000000000703",\n        ...mapped,\n        approved_by_admin_id: null,\n        approved_at: null,\n        created_at: "2026-07-27T20:00:00Z",\n        updated_at: "2026-07-27T20:00:00Z",\n      });\n      return;\n    }\n`;
  next = insertAfter(next, marker, addition, "RPCs de memória");
  return next;
});

await update("tests/e2e/photo-interactions-fixtures.ts", source => {
  let next = source.replace('storage_path: "fixtures/gincana.svg",', "storage_path: null,");
  const marker = "    const method = request.method();\n";
  const addition = `\n    if (restPath === "rpc/submit_photo_comment" && method === "POST") {\n      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;\n      const mapped = {\n        photo_id: body.p_photo_id,\n        user_id: TEST_USER_ID,\n        author_name: "Maria Cabeção",\n        comment_text: body.p_comment_text,\n        status: "pending",\n      };\n      commentCalls.push(mapped);\n      await fulfillJson(route, { id: "00000000-0000-4000-8000-000000000912", ...mapped, approved_by_admin_id: null, approved_at: null, created_at: "2026-07-27T20:30:00Z", updated_at: "2026-07-27T20:30:00Z" });\n      return;\n    }\n\n    if (restPath === "rpc/submit_photo_tag" && method === "POST") {\n      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;\n      tagCalls.push({\n        photo_id: body.p_photo_id,\n        person_id: body.p_person_id,\n        tagged_name_snapshot: body.p_tagged_name,\n        status: "pending",\n        created_by_user_id: TEST_USER_ID,\n      });\n      await fulfillJson(route, { id: "00000000-0000-4000-8000-000000000913", status: "pending" });\n      return;\n    }\n\n    if (restPath === "rpc/submit_photo_removal_request" && method === "POST") {\n      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;\n      const mapped = {\n        photo_id: body.p_photo_id,\n        requester_user_id: TEST_USER_ID,\n        requester_name: body.p_requester_name,\n        requester_email: body.p_requester_email,\n        reason: body.p_reason,\n        status: "pending",\n      };\n      removalCalls.push(mapped);\n      await fulfillJson(route, { id: "00000000-0000-4000-8000-000000000921", ...mapped, created_at: "2026-07-27T20:35:00Z", updated_at: "2026-07-27T20:35:00Z" });\n      return;\n    }\n`;
  next = insertAfter(next, marker, addition, "RPCs de interações em fotos");
  return next;
});
