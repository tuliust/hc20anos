import type { Page, Route } from "@playwright/test";
import {
  installAuthenticatedProfileClaimFixtures,
} from "./profile-claim-fixtures";

export const TEST_PENDING_MEMORY_ID = "00000000-0000-4000-8000-000000001001";
export const TEST_PENDING_COMMENT_ID = "00000000-0000-4000-8000-000000001002";
const EVENT_ID = "00000000-0000-0000-0000-000000000001";

const pendingMemory = {
  id: TEST_PENDING_MEMORY_ID,
  event_id: EVENT_ID,
  user_id: "00000000-0000-4000-8000-000000000120",
  person_id: null,
  author_name: "Autora protegida",
  memory_text: "A biblioteca era nosso refúgio nos intervalos mais tranquilos.",
  is_anonymous: true,
  status: "pending",
  is_featured: false,
  approved_by_admin_id: null,
  approved_at: null,
  created_at: "2026-07-25T12:00:00Z",
  updated_at: "2026-07-25T12:00:00Z",
};

const pendingComment = {
  id: TEST_PENDING_COMMENT_ID,
  photo_id: "00000000-0000-4000-8000-000000000901",
  user_id: "00000000-0000-4000-8000-000000000121",
  author_name: "Comentador de teste",
  comment_text: "Comentário aguardando revisão editorial.",
  status: "pending",
  approved_by_admin_id: null,
  approved_at: null,
  created_at: "2026-07-25T13:00:00Z",
  updated_at: "2026-07-25T13:00:00Z",
  photos: {
    image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%232d6a4f'/%3E%3C/svg%3E",
    caption: "Gincana no pátio",
  },
};

const moderationSettings = {
  event_id: EVENT_ID,
  auto_approve_photos: false,
  auto_approve_comments: false,
  auto_approve_memories: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type EditorialModerationApiState = {
  moderationCalls: Record<string, unknown>[];
  auditCalls: Record<string, unknown>[];
};

export async function installEditorialModerationFixtures(page: Page): Promise<EditorialModerationApiState> {
  await installAuthenticatedProfileClaimFixtures(page, { admin: true });

  const moderationCalls: Record<string, unknown>[] = [];
  const auditCalls: Record<string, unknown>[] = [];
  let memoryStatus = "pending";
  let commentStatus = "pending";

  await page.route("**/rest/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const restPath = url.pathname.split("/rest/v1/")[1] ?? "";
    const resource = restPath.split("/")[0];
    const method = request.method();
    const isSingle = (request.headers()["accept"] ?? "").includes("application/vnd.pgrst.object+json");

    if (restPath === "rpc/moderate_content_item" && method === "POST") {
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      moderationCalls.push(body);
      const entityType = String(body.p_entity_type ?? "");
      const nextStatus = String(body.p_status ?? "pending");
      if (entityType === "memory") memoryStatus = nextStatus;
      if (entityType === "photo_comment") commentStatus = nextStatus;
      await fulfillJson(route, {
        entity_type: entityType,
        entity_id: body.p_entity_id,
        previous_status: "pending",
        status: nextStatus,
      });
      return;
    }

    if (resource === "content_moderation_settings") {
      await fulfillJson(route, isSingle ? moderationSettings : [moderationSettings]);
      return;
    }

    if (resource === "memories" && method === "GET") {
      const requestedStatus = (url.searchParams.get("status") ?? "").replace(/^eq\./, "");
      const rows = !requestedStatus || requestedStatus === memoryStatus
        ? [{ ...pendingMemory, status: memoryStatus }]
        : [];
      await fulfillJson(route, rows);
      return;
    }

    if (resource === "photo_comments" && method === "GET") {
      const requestedStatus = (url.searchParams.get("status") ?? "").replace(/^eq\./, "");
      const rows = !requestedStatus || requestedStatus === commentStatus
        ? [{ ...pendingComment, status: commentStatus }]
        : [];
      await fulfillJson(route, rows);
      return;
    }

    if (resource === "audit_logs" && method === "POST") {
      auditCalls.push((request.postDataJSON() ?? {}) as Record<string, unknown>);
      await fulfillJson(route, [], 201);
      return;
    }

    await route.fallback();
  });

  return { moderationCalls, auditCalls };
}
