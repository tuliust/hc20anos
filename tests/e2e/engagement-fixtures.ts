import type { Page, Route } from "@playwright/test";
import {
  TEST_USER_ID,
  installAuthenticatedProfileClaimFixtures,
} from "./profile-claim-fixtures";

export const TEST_MEMORY_ID = "00000000-0000-4000-8000-000000000701";
export const TEST_ANONYMOUS_MEMORY_ID = "00000000-0000-4000-8000-000000000702";
export const TEST_POLL_ID = "00000000-0000-4000-8000-000000000801";
export const TEST_CLOSED_POLL_ID = "00000000-0000-4000-8000-000000000802";
export const TEST_POLL_OPTION_A = "00000000-0000-4000-8000-000000000811";
export const TEST_POLL_OPTION_B = "00000000-0000-4000-8000-000000000812";

const EVENT_ID = "00000000-0000-0000-0000-000000000001";

const approvedMemories = [
  {
    id: TEST_MEMORY_ID,
    event_id: EVENT_ID,
    user_id: "00000000-0000-4000-8000-000000000111",
    person_id: null,
    author_name: "Ana da Turma",
    memory_text: "A gincana no pátio ainda rende histórias em todos os encontros.",
    is_anonymous: false,
    status: "approved",
    is_featured: true,
    approved_by_admin_id: null,
    approved_at: "2026-07-20T12:00:00Z",
    created_at: "2026-07-19T12:00:00Z",
    updated_at: "2026-07-20T12:00:00Z",
  },
  {
    id: TEST_ANONYMOUS_MEMORY_ID,
    event_id: EVENT_ID,
    user_id: "00000000-0000-4000-8000-000000000112",
    person_id: null,
    author_name: "Autor Confidencial",
    memory_text: "O corredor principal era o ponto de encontro antes de cada aula.",
    is_anonymous: true,
    status: "approved",
    is_featured: false,
    approved_by_admin_id: null,
    approved_at: "2026-07-20T13:00:00Z",
    created_at: "2026-07-19T13:00:00Z",
    updated_at: "2026-07-20T13:00:00Z",
  },
];

const polls = [
  {
    id: TEST_POLL_ID,
    event_id: EVENT_ID,
    question: "Qual lugar mais representa a turma?",
    description: "Escolha uma lembrança coletiva.",
    status: "open",
    allow_multiple_votes: false,
    created_by_admin_id: null,
    created_at: "2026-07-18T12:00:00Z",
    updated_at: "2026-07-18T12:00:00Z",
    poll_options: [
      {
        id: TEST_POLL_OPTION_A,
        poll_id: TEST_POLL_ID,
        option_text: "Pátio da escola",
        sort_order: 0,
        created_at: "2026-07-18T12:00:00Z",
      },
      {
        id: TEST_POLL_OPTION_B,
        poll_id: TEST_POLL_ID,
        option_text: "Corredor principal",
        sort_order: 1,
        created_at: "2026-07-18T12:00:00Z",
      },
    ],
  },
  {
    id: TEST_CLOSED_POLL_ID,
    event_id: EVENT_ID,
    question: "Qual tradição deve voltar no reencontro?",
    description: null,
    status: "closed",
    allow_multiple_votes: false,
    created_by_admin_id: null,
    created_at: "2026-07-17T12:00:00Z",
    updated_at: "2026-07-17T12:00:00Z",
    poll_options: [
      {
        id: "00000000-0000-4000-8000-000000000821",
        poll_id: TEST_CLOSED_POLL_ID,
        option_text: "Gincana",
        sort_order: 0,
        created_at: "2026-07-17T12:00:00Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000822",
        poll_id: TEST_CLOSED_POLL_ID,
        option_text: "Festival cultural",
        sort_order: 1,
        created_at: "2026-07-17T12:00:00Z",
      },
    ],
  },
];

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type EngagementApiState = {
  memoryCalls: Record<string, unknown>[];
  pollVoteDeletes: number;
  pollVoteCalls: Record<string, unknown>[];
};

export async function installEngagementFixtures(page: Page): Promise<EngagementApiState> {
  await installAuthenticatedProfileClaimFixtures(page);

  const memoryCalls: Record<string, unknown>[] = [];
  const pollVoteCalls: Record<string, unknown>[] = [];
  let pollVoteDeletes = 0;
  let myVotes: Record<string, unknown>[] = [];
  const pollCounts: Record<string, Record<string, number>> = {
    [TEST_POLL_ID]: {
      [TEST_POLL_OPTION_A]: 2,
      [TEST_POLL_OPTION_B]: 1,
    },
    [TEST_CLOSED_POLL_ID]: {
      "00000000-0000-4000-8000-000000000821": 4,
      "00000000-0000-4000-8000-000000000822": 3,
    },
  };

  await page.route("**/rest/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const restPath = url.pathname.split("/rest/v1/")[1] ?? "";
    const resource = restPath.split("/")[0];
    const method = request.method();

    if (resource === "memories") {
      if (method === "GET") {
        await fulfillJson(route, approvedMemories);
        return;
      }

      if (method === "POST") {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        memoryCalls.push(body);
        await fulfillJson(route, {
          id: "00000000-0000-4000-8000-000000000703",
          ...body,
          created_at: "2026-07-27T20:00:00Z",
          updated_at: "2026-07-27T20:00:00Z",
        }, 201);
        return;
      }
    }

    if (resource === "polls" && method === "GET") {
      await fulfillJson(route, polls);
      return;
    }

    if (resource === "poll_results" && method === "GET") {
      const pollId = (url.searchParams.get("poll_id") ?? "").replace(/^eq\./, "");
      const rows = Object.entries(pollCounts[pollId] ?? {}).map(([option_id, votes_count]) => ({
        poll_id: pollId,
        option_id,
        votes_count,
      }));
      await fulfillJson(route, rows);
      return;
    }

    if (resource === "poll_votes") {
      if (method === "GET") {
        await fulfillJson(route, myVotes);
        return;
      }

      if (method === "DELETE") {
        pollVoteDeletes += 1;
        myVotes = [];
        await fulfillJson(route, []);
        return;
      }

      if (method === "POST") {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        pollVoteCalls.push(body);
        const pollId = String(body.poll_id ?? "");
        const optionId = String(body.option_id ?? "");
        myVotes = [{
          id: "00000000-0000-4000-8000-000000000831",
          poll_id: pollId,
          option_id: optionId,
          user_id: TEST_USER_ID,
          created_at: "2026-07-27T20:00:00Z",
        }];
        pollCounts[pollId] = {
          ...(pollCounts[pollId] ?? {}),
          [optionId]: Number(pollCounts[pollId]?.[optionId] ?? 0) + 1,
        };
        await fulfillJson(route, [], 201);
        return;
      }
    }

    await route.fallback();
  });

  return {
    memoryCalls,
    get pollVoteDeletes() {
      return pollVoteDeletes;
    },
    pollVoteCalls,
  };
}
