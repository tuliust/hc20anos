import type { Page, Route } from "@playwright/test";
import {
  TEST_PERSON_ID,
  TEST_USER_ID,
  installAuthenticatedProfileClaimFixtures,
} from "./profile-claim-fixtures";

export const TEST_PHOTO_ID = "00000000-0000-4000-8000-000000000901";
export const TEST_TAG_PERSON_ID = "00000000-0000-4000-8000-000000000202";
const EVENT_ID = "00000000-0000-0000-0000-000000000001";

const peopleRows = [
  {
    id: TEST_PERSON_ID,
    full_name: "Maria Cabeção da Silva Souza",
    display_name: "Maria Cabeção",
    class_year: 2006,
    class_group: "A",
    birth_year: 1988,
    gender: "female",
    nickname_at_school: null,
    profile_status: "claimed",
    verification_status: "approved",
    claimed_by_user_id: TEST_USER_ID,
    claimed_at: "2026-07-21T16:00:00Z",
    is_visible: true,
    private_notes: null,
    avatar_url: null,
    contact_email: "claimant@example.com",
    contact_whatsapp: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-21T16:00:00Z",
  },
  {
    id: TEST_TAG_PERSON_ID,
    full_name: "João Vitor Melo",
    display_name: "João Vitor",
    class_year: 2006,
    class_group: "B",
    birth_year: 1988,
    gender: "male",
    nickname_at_school: "JV",
    profile_status: "confirmed",
    verification_status: "approved",
    claimed_by_user_id: "00000000-0000-4000-8000-000000000102",
    claimed_at: "2026-07-20T16:00:00Z",
    is_visible: true,
    private_notes: null,
    avatar_url: null,
    contact_email: null,
    contact_whatsapp: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-20T16:00:00Z",
  },
];

const photoRow = {
  id: TEST_PHOTO_ID,
  event_id: EVENT_ID,
  image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%232d6a4f'/%3E%3C/svg%3E",
  thumbnail_url: null,
  storage_path: "fixtures/gincana.svg",
  caption: "Gincana no pátio",
  year_approx: 2005,
  location_text: "Pátio do HC",
  uploaded_by_user_id: "00000000-0000-4000-8000-000000000113",
  uploaded_by_name: "Arquivo da turma",
  authorization_given: true,
  status: "approved",
  approved_by_admin_id: null,
  approved_at: "2026-07-20T12:00:00Z",
  is_featured: true,
  featured_by_admin_id: null,
  featured_at: "2026-07-20T12:00:00Z",
  created_at: "2026-07-19T12:00:00Z",
  updated_at: "2026-07-20T12:00:00Z",
  photo_tags: [
    {
      person_id: TEST_PERSON_ID,
      tagged_name_snapshot: "Maria Cabeção da Silva Souza",
      status: "approved",
    },
  ],
};

const approvedComment = {
  id: "00000000-0000-4000-8000-000000000911",
  photo_id: TEST_PHOTO_ID,
  user_id: "00000000-0000-4000-8000-000000000114",
  author_name: "Bruno da Turma",
  comment_text: "Essa gincana foi inesquecível.",
  status: "approved",
  approved_by_admin_id: null,
  approved_at: "2026-07-21T12:00:00Z",
  created_at: "2026-07-20T12:00:00Z",
  updated_at: "2026-07-21T12:00:00Z",
};

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type PhotoInteractionsApiState = {
  likeCalls: Record<string, unknown>[];
  commentCalls: Record<string, unknown>[];
  tagCalls: Record<string, unknown>[];
  removalCalls: Record<string, unknown>[];
};

export async function installPhotoInteractionsFixtures(page: Page): Promise<PhotoInteractionsApiState> {
  await installAuthenticatedProfileClaimFixtures(page);

  const likeCalls: Record<string, unknown>[] = [];
  const commentCalls: Record<string, unknown>[] = [];
  const tagCalls: Record<string, unknown>[] = [];
  const removalCalls: Record<string, unknown>[] = [];
  let liked = false;

  await page.route("**/rest/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const restPath = url.pathname.split("/rest/v1/")[1] ?? "";
    const resource = restPath.split("/")[0];
    const method = request.method();

    if (resource === "people" && method === "GET") {
      await fulfillJson(route, peopleRows);
      return;
    }

    if (resource === "photos" && method === "GET") {
      await fulfillJson(route, [photoRow]);
      return;
    }

    if (resource === "photo_likes") {
      if (method === "GET") {
        const isPersonalQuery = url.searchParams.has("user_id");
        if (isPersonalQuery) {
          await fulfillJson(route, liked ? [{ photo_id: TEST_PHOTO_ID }] : []);
          return;
        }
        await fulfillJson(route, Array.from({ length: liked ? 2 : 1 }, () => ({ photo_id: TEST_PHOTO_ID })));
        return;
      }

      if (method === "POST") {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        likeCalls.push(body);
        liked = true;
        await fulfillJson(route, [], 201);
        return;
      }

      if (method === "DELETE") {
        liked = false;
        await fulfillJson(route, []);
        return;
      }
    }

    if (resource === "photo_comments") {
      if (method === "GET") {
        const select = url.searchParams.get("select") ?? "";
        await fulfillJson(route, select === "photo_id" ? [{ photo_id: TEST_PHOTO_ID }] : [approvedComment]);
        return;
      }

      if (method === "POST") {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        commentCalls.push(body);
        await fulfillJson(route, {
          id: "00000000-0000-4000-8000-000000000912",
          ...body,
          created_at: "2026-07-27T20:30:00Z",
          updated_at: "2026-07-27T20:30:00Z",
        }, 201);
        return;
      }
    }

    if (resource === "photo_tags" && method === "POST") {
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      tagCalls.push(body);
      await fulfillJson(route, [], 201);
      return;
    }

    if (resource === "photo_removal_requests" && method === "POST") {
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      removalCalls.push(body);
      await fulfillJson(route, {
        id: "00000000-0000-4000-8000-000000000921",
        ...body,
        created_at: "2026-07-27T20:35:00Z",
        updated_at: "2026-07-27T20:35:00Z",
      }, 201);
      return;
    }

    await route.fallback();
  });

  return { likeCalls, commentCalls, tagCalls, removalCalls };
}
