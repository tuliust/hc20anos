import type { Page, Route } from "@playwright/test";

export const TEST_USER_ID = "00000000-0000-4000-8000-000000000101";
export const TEST_PERSON_ID = "00000000-0000-4000-8000-000000000201";
export const TEST_PROFILE_ID = "00000000-0000-4000-8000-000000000301";
export const TEST_ADMIN_ID = "00000000-0000-4000-8000-000000000401";
export const PENDING_PROFILE_CLAIM_KEY = "hc-pending-profile-claim-v3";
const SUPABASE_AUTH_STORAGE_KEY = "sb-supabase-auth-token";

const eventRow = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "Reencontro da Turma 2006",
  slug: "reencontro-20-anos",
  description: "Evento de reencontro.",
  event_date: "2026-10-24",
  event_time: "14:00:00",
  location_name: "Sede Campestre do HC",
  location_address: "Natal/RN",
  event_status: "published",
  sales_status: "open",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const personRow = {
  id: TEST_PERSON_ID,
  full_name: "Maria Cabeção da Silva Souza",
  display_name: "Maria Cabeção",
  class_year: 2006,
  class_group: "A",
  birth_year: 1988,
  gender: "female",
  nickname_at_school: null,
  profile_status: "unclaimed",
  verification_status: "not_started",
  claimed_by_user_id: null,
  claimed_at: null,
  is_visible: true,
  private_notes: null,
  avatar_url: null,
  contact_email: null,
  contact_whatsapp: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const profileRow = {
  id: TEST_PROFILE_ID,
  person_id: TEST_PERSON_ID,
  user_id: TEST_USER_ID,
  display_name: "Maria Cabeção",
  current_photo_url: null,
  current_city: "Natal",
  current_state: "RN",
  current_country: "Brasil",
  profession: null,
  bio: null,
  contact_email: "claimant@example.com",
  created_at: "2026-07-21T16:00:00Z",
  updated_at: "2026-07-21T16:00:00Z",
};

const adminRow = {
  id: TEST_ADMIN_ID,
  user_id: TEST_USER_ID,
  role: "admin",
  display_name: "Admin de teste",
  email: "admin@example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const disputes = [
  {
    id: "00000000-0000-4000-8000-000000000501",
    person_id: TEST_PERSON_ID,
    current_claimant_user_id: TEST_USER_ID,
    requester_user_id: "00000000-0000-4000-8000-000000000102",
    requester_name: "Solicitante atual",
    requester_email: "requester@example.com",
    requester_phone: null,
    reason: "Solicito revisão do vínculo.",
    evidence_text: null,
    status: "pending",
    reviewed_by_admin_id: null,
    reviewed_at: null,
    admin_notes: null,
    created_at: "2026-07-21T17:00:00Z",
    updated_at: "2026-07-21T17:00:00Z",
    people: { full_name: personRow.full_name, nickname_at_school: null, class_group: "A" },
    identity_verification: {
      id: "00000000-0000-4000-8000-000000000601",
      declared_birth_date: "1988-04-03",
      created_at: "2026-07-21T16:00:00Z",
      claimant_user_id: TEST_USER_ID,
      claimant_email: "claimant@example.com",
      penultimate_surname_answer: "Silva",
      class_group_answer: "A",
    },
  },
  {
    id: "00000000-0000-4000-8000-000000000502",
    person_id: "00000000-0000-4000-8000-000000000202",
    current_claimant_user_id: null,
    requester_user_id: "00000000-0000-4000-8000-000000000103",
    requester_name: "Reivindicação antiga",
    requester_email: "legacy@example.com",
    requester_phone: null,
    reason: "Registro anterior à atualização.",
    evidence_text: null,
    status: "pending",
    reviewed_by_admin_id: null,
    reviewed_at: null,
    admin_notes: null,
    created_at: "2026-06-01T12:00:00Z",
    updated_at: "2026-06-01T12:00:00Z",
    people: { full_name: "Pessoa sem evidência", nickname_at_school: null, class_group: "B" },
    identity_verification: null,
  },
];

function toBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createSession(email: string) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: TEST_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: "2026-07-21T15:55:00Z",
    phone: "",
    confirmation_sent_at: null,
    confirmed_at: "2026-07-21T15:55:00Z",
    last_sign_in_at: "2026-07-21T16:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: "2026-07-21T15:50:00Z",
    updated_at: "2026-07-21T16:00:00Z",
    is_anonymous: false,
  };
  const accessToken = [
    toBase64Url({ alg: "HS256", typ: "JWT" }),
    toBase64Url({
      aud: "authenticated",
      exp: now + 3600,
      iat: now,
      iss: "https://supabase.test/auth/v1",
      role: "authenticated",
      sub: TEST_USER_ID,
      email,
    }),
    "test-signature",
  ].join(".");

  return {
    access_token: accessToken,
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: "bearer",
    user,
  };
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type ProfileClaimApiState = {
  registrationCalls: Record<string, unknown>[];
};

export async function installAuthenticatedProfileClaimFixtures(
  page: Page,
  options: { pendingClaim?: Record<string, unknown>; admin?: boolean } = {},
): Promise<ProfileClaimApiState> {
  const session = createSession(options.admin ? "admin@example.com" : "claimant@example.com");
  const registrationCalls: Record<string, unknown>[] = [];

  await page.addInitScript(
    ({ authStorageKey, pendingKey, storedSession, pendingClaim }) => {
      window.localStorage.setItem(authStorageKey, JSON.stringify(storedSession));
      if (pendingClaim) window.localStorage.setItem(pendingKey, JSON.stringify(pendingClaim));
    },
    {
      authStorageKey: SUPABASE_AUTH_STORAGE_KEY,
      pendingKey: PENDING_PROFILE_CLAIM_KEY,
      storedSession: session,
      pendingClaim: options.pendingClaim ?? null,
    },
  );

  await page.route("**/auth/v1/**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/user")) {
      await fulfillJson(route, session.user);
      return;
    }
    await fulfillJson(route, session);
  });

  await page.route("**/rest/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const restPath = url.pathname.split("/rest/v1/")[1] ?? "";

    if (restPath === "rpc/complete_profile_registration_v3") {
      registrationCalls.push((request.postDataJSON() ?? {}) as Record<string, unknown>);
      await fulfillJson(route, profileRow);
      return;
    }

    if (restPath === "rpc/admin_get_profile_claim_disputes_with_identity") {
      await fulfillJson(route, disputes);
      return;
    }

    if (restPath.startsWith("rpc/")) {
      await fulfillJson(route, []);
      return;
    }

    const resource = restPath.split("?")[0].split("/")[0];
    const isSingle = (request.headers()["accept"] ?? "").includes("application/vnd.pgrst.object+json");
    let rows: unknown[] = [];

    switch (resource) {
      case "events":
        rows = [eventRow];
        break;
      case "people":
        rows = [personRow];
        break;
      case "profiles":
        rows = [profileRow];
        break;
      case "admin_users":
        rows = options.admin ? [adminRow] : [];
        break;
      case "home_page_content":
      case "event_page_content":
      case "event_archive_settings":
      case "content_moderation_settings":
        rows = [];
        break;
      default:
        rows = [];
    }

    if (isSingle) {
      await fulfillJson(route, rows[0] ?? null);
      return;
    }

    await fulfillJson(route, rows);
  });

  await page.route("**/storage/v1/**", route => fulfillJson(route, {}));

  return { registrationCalls };
}

export function pendingProfileClaimFixture() {
  return {
    registration: {
      personId: TEST_PERSON_ID,
      penultimateSurname: "Silva",
      classGroupConfirmation: "A",
      declaredBirthDate: "1988-04-03",
      fullName: personRow.full_name,
      displayName: personRow.display_name,
      classGroup: "A",
      currentPhotoUrl: null,
      currentCity: "Natal",
      currentState: "RN",
      currentCountry: "Brasil",
      profession: null,
      bio: null,
      nicknameAtSchool: null,
      instagramUrl: null,
      linkedinUrl: null,
      contactEmail: "claimant@example.com",
      contactWhatsapp: "84999999999",
      relationshipStatus: null,
      hasChildren: false,
      childrenCount: null,
      intendsToAttend: true,
      showCurrentPhoto: true,
      showCity: true,
      showProfession: true,
      showSocialLinks: false,
      allowPhotoTags: true,
      showConfirmedStatus: true,
    },
    questionnaireAnswers: {
      school_personality: ["Adorava me comunicar"],
    },
    createdAt: "2026-07-21T15:58:00.000Z",
  };
}
