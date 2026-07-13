// ================================================================
// Services — Turma 2006
// Todas as funções tentam o Supabase primeiro e caem no mock se
// o banco não estiver configurado (DEV_MODE) ou houver erro.
// ================================================================

import { DEV_MODE, supabase } from "./supabase";
import type {
  DbPerson, DbTicketType, DbPhoto, DbPhotoTag,
  DbProfileClaim, DbProfileClaimAnswer, DbTicket,
  DbOrder, DbEvent, DbProfile, InsertOrder, UpsertProfile,
  DbAdminUser, DbAuditLog, TicketStatus, AdminRole,
  DbPhotoRemovalRequest, DbProfileClaimDispute,
  DbPhotoLike, DbPhotoComment, DbMemory, PhotoStats, ModerationStatus,
  DbPoll, DbPollOption, DbPollVote, PollStatus, PollResultRow, LocationStat, PublicLocationRow, PublicProfileCardRow, AlumniDirectoryStatusRow, CuriosityProfileStatsRow, SchoolQuestionnaireOptionStatRow, TicketWithDetails, Gender,
  DbEventArchiveSettings, DbEventPageContent,
} from "./database.types";

export interface HomePageContent {
  event_id: string;
  header_logo_url?: string | null;
  favicon_url?: string | null;
  hero_eyebrow: string;
  hero_title: string;
  hero_tagline: string;
  hero_subtitle: string;
  hero_event_line: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  about_eyebrow: string;
  about_title: string;
  about_body_1: string;
  about_body_2: string;
  info_eyebrow: string;
  info_title: string;
  tickets_eyebrow: string;
  tickets_title: string;
  confirmed_eyebrow: string;
  confirmed_title: string;
  photos_eyebrow: string;
  photos_title: string;
  timeline_eyebrow: string;
  timeline_title: string;
  faq_eyebrow: string;
  faq_title: string;
  updated_at?: string | null;
  updated_by_admin_id?: string | null;
}

const DEFAULT_HOME_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export const HOME_PAGE_CONTENT_DEFAULTS: HomePageContent = {
  event_id: DEFAULT_HOME_EVENT_ID,
  header_logo_url: null,
  favicon_url: null,
  hero_eyebrow: "",
  hero_title: "",
  hero_tagline: "",
  hero_subtitle: "",
  hero_event_line: "",
  primary_cta_label: "",
  secondary_cta_label: "",
  about_eyebrow: "",
  about_title: "",
  about_body_1: "",
  about_body_2: "",
  info_eyebrow: "",
  info_title: "",
  tickets_eyebrow: "",
  tickets_title: "",
  confirmed_eyebrow: "",
  confirmed_title: "",
  photos_eyebrow: "",
  photos_title: "",
  timeline_eyebrow: "",
  timeline_title: "",
  faq_eyebrow: "",
  faq_title: "",
};

export interface EventPageGalleryItem {
  image_url: string;
  caption?: string | null;
  alt?: string | null;
}

export interface EventPageInfoItem {
  title: string;
  description: string;
}

export interface EventPageScheduleItem {
  time: string;
  title: string;
  description?: string | null;
}

export interface EventPageContent {
  event_id: string;
  hero_eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  hero_image_url?: string | null;
  gallery_json: string;
  map_embed_url?: string | null;
  map_link_url?: string | null;
  venue_notes: string;
  attractions_json: string;
  schedule_json: string;
  food_bar_text: string;
  bathrooms_text: string;
  security_text: string;
  extra_info_json: string;
  updated_at?: string | null;
  updated_by_admin_id?: string | null;
}

export const EVENT_PAGE_CONTENT_DEFAULTS: EventPageContent = {
  event_id: DEFAULT_HOME_EVENT_ID,
  hero_eyebrow: "",
  title: "",
  subtitle: "",
  description: "",
  hero_image_url: null,
  gallery_json: "[]",
  map_embed_url: "",
  map_link_url: "",
  venue_notes: "",
  attractions_json: "[]",
  schedule_json: "[]",
  food_bar_text: "",
  bathrooms_text: "",
  security_text: "",
  extra_info_json: "[]",
};

function stringifyJsonField(value: unknown, fallback: string) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  if (value === null || value === undefined) return fallback;
  return JSON.stringify(value, null, 2);
}

function parseJsonField(value: string, fallback: unknown[]) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeEventPageContent(data?: Partial<DbEventPageContent> | null, eventId = DEFAULT_HOME_EVENT_ID): EventPageContent {
  return {
    ...EVENT_PAGE_CONTENT_DEFAULTS,
    event_id: eventId,
    ...(data ?? {}),
    hero_eyebrow: data?.hero_eyebrow ?? EVENT_PAGE_CONTENT_DEFAULTS.hero_eyebrow,
    title: data?.title ?? EVENT_PAGE_CONTENT_DEFAULTS.title,
    subtitle: data?.subtitle ?? EVENT_PAGE_CONTENT_DEFAULTS.subtitle,
    description: data?.description ?? EVENT_PAGE_CONTENT_DEFAULTS.description,
    hero_image_url: data?.hero_image_url ?? EVENT_PAGE_CONTENT_DEFAULTS.hero_image_url,
    gallery_json: stringifyJsonField(data?.gallery_json, EVENT_PAGE_CONTENT_DEFAULTS.gallery_json),
    map_embed_url: data?.map_embed_url ?? EVENT_PAGE_CONTENT_DEFAULTS.map_embed_url,
    map_link_url: data?.map_link_url ?? EVENT_PAGE_CONTENT_DEFAULTS.map_link_url,
    venue_notes: data?.venue_notes ?? EVENT_PAGE_CONTENT_DEFAULTS.venue_notes,
    attractions_json: stringifyJsonField(data?.attractions_json, EVENT_PAGE_CONTENT_DEFAULTS.attractions_json),
    schedule_json: stringifyJsonField(data?.schedule_json, EVENT_PAGE_CONTENT_DEFAULTS.schedule_json),
    food_bar_text: data?.food_bar_text ?? EVENT_PAGE_CONTENT_DEFAULTS.food_bar_text,
    bathrooms_text: data?.bathrooms_text ?? EVENT_PAGE_CONTENT_DEFAULTS.bathrooms_text,
    security_text: data?.security_text ?? EVENT_PAGE_CONTENT_DEFAULTS.security_text,
    extra_info_json: stringifyJsonField(data?.extra_info_json, EVENT_PAGE_CONTENT_DEFAULTS.extra_info_json),
    updated_at: data?.updated_at ?? null,
    updated_by_admin_id: data?.updated_by_admin_id ?? null,
  };
}

// ─── MOCK DATA (fallback) ─────────────────────────────────────────────────────

export const MOCK_PEOPLE: DbPerson[] = [
  { id:"00000000-0000-0000-0002-000000000001", full_name:"Ana Paula Oliveira",   class_year:2006, class_group:"A", nickname_at_school:"Aninha",    profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000002", full_name:"Bruno Cavalcanti",     class_year:2006, class_group:"B", nickname_at_school:"Brunão",    profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000003", full_name:"Carla Medeiros",       class_year:2006, class_group:"A", nickname_at_school:"Carlinha",  profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000004", full_name:"Diego Ferreira",       class_year:2006, class_group:"B", nickname_at_school:"Diegão",    profile_status:"claimed",   claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000005", full_name:"Eduarda Lima",         class_year:2006, class_group:"A", nickname_at_school:"Du",        profile_status:"claimed",   claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000006", full_name:"Felipe Araújo",        class_year:2006, class_group:"C", nickname_at_school:"Fepa",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000007", full_name:"Gabriela Santos",      class_year:2006, class_group:"B", nickname_at_school:"Gabi",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000008", full_name:"Henrique Costa",       class_year:2006, class_group:"C", nickname_at_school:"Kiko",      profile_status:"unclaimed", claimed_by_user_id:null, claimed_at:null, is_visible:false, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000009", full_name:"Isabela Rodrigues",    class_year:2006, class_group:"A", nickname_at_school:"Bela",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000010", full_name:"João Vitor Melo",      class_year:2006, class_group:"B", nickname_at_school:"JV",        profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000011", full_name:"Karoline Freitas",     class_year:2006, class_group:"C", nickname_at_school:"Karo",      profile_status:"claimed",   claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000012", full_name:"Lucas Nogueira",       class_year:2006, class_group:"A", nickname_at_school:"Luquinhas", profile_status:"unclaimed", claimed_by_user_id:null, claimed_at:null, is_visible:false, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000013", full_name:"Marina Pinheiro",      class_year:2006, class_group:"B", nickname_at_school:"Mari",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000014", full_name:"Nathan Alves",         class_year:2006, class_group:"C", nickname_at_school:"Nath",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000015", full_name:"Olivia Carvalho",      class_year:2006, class_group:"A", nickname_at_school:"Oli",       profile_status:"claimed",   claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000016", full_name:"Pedro Gomes",          class_year:2006, class_group:"B", nickname_at_school:"PH",        profile_status:"unclaimed", claimed_by_user_id:null, claimed_at:null, is_visible:false, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000017", full_name:"Rafaela Souza",        class_year:2006, class_group:"C", nickname_at_school:"Rafa",      profile_status:"confirmed", claimed_by_user_id:null, claimed_at:null, is_visible:true, private_notes:null, created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0002-000000000018", full_name:"Sandro Vieira",        class_year:2006, class_group:"A", nickname_at_school:"Sandão",    profile_status:"unclaimed", claimed_by_user_id:null, claimed_at:null, is_visible:false, private_notes:null, created_at:"", updated_at:"" },
];

const MOCK_TICKET_TYPES: DbTicketType[] = [
  { id:"00000000-0000-0000-0001-000000000001", event_id:"00000000-0000-0000-0000-000000000001", name:"Ingresso Individual — 1º Lote",           description:null, price_cents:12000, available_quantity:100, sold_quantity:53, sales_start_at:null, sales_end_at:null, allows_guest:false, status:"open",     created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0001-000000000002", event_id:"00000000-0000-0000-0000-000000000001", name:"Ingresso Casal — 1º Lote",                description:null, price_cents:20000, available_quantity:50,  sold_quantity:42, sales_start_at:null, sales_end_at:null, allows_guest:true,  status:"open",     created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0001-000000000003", event_id:"00000000-0000-0000-0000-000000000001", name:"Mesa VIP — Edição Limitada (4 pessoas)", description:null, price_cents:60000, available_quantity:20,  sold_quantity:20, sales_start_at:null, sales_end_at:null, allows_guest:true,  status:"sold_out", created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0001-000000000004", event_id:"00000000-0000-0000-0000-000000000001", name:"Ingresso Individual — 2º Lote",           description:null, price_cents:15000, available_quantity:100, sold_quantity:0,  sales_start_at:null, sales_end_at:null, allows_guest:false, status:"closed",   created_at:"", updated_at:"" },
  { id:"00000000-0000-0000-0001-000000000005", event_id:"00000000-0000-0000-0000-000000000001", name:"Ingresso Casal — 2º Lote",                description:null, price_cents:25000, available_quantity:50,  sold_quantity:0,  sales_start_at:null, sales_end_at:null, allows_guest:true,  status:"closed",   created_at:"", updated_at:"" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (DEV_MODE) return fallback;
    throw error;
  }
}

const FUNCTIONS_BASE_URL = `${(import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "")}/functions/v1/server/make-server-62fab262`;

async function callFunction<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("apikey", import.meta.env.VITE_SUPABASE_ANON_KEY as string);
  headers.set("Authorization", `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`);

  const response = await fetch(`${FUNCTIONS_BASE_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? "Erro ao chamar funcao segura");
  return payload as T;
}

export async function getHomePageContent(eventId = DEFAULT_HOME_EVENT_ID): Promise<HomePageContent> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("home_page_content")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    return { ...HOME_PAGE_CONTENT_DEFAULTS, ...(data ?? {}), event_id: eventId } as HomePageContent;
  }, HOME_PAGE_CONTENT_DEFAULTS);
}

export async function updateHomePageContent(
  eventId: string,
  patch: Partial<HomePageContent>,
  adminId?: string
): Promise<HomePageContent> {
  const payload = {
    ...patch,
    event_id: eventId,
    updated_by_admin_id: adminId ?? null,
  };

  const { data, error } = await (supabase as any)
    .from("home_page_content")
    .upsert(payload, { onConflict: "event_id" })
    .select("*")
    .single();

  if (error) throw error;
  await writeAudit("update_home_page_content", "home_page_content", eventId, { patch }).catch(() => {});
  return { ...HOME_PAGE_CONTENT_DEFAULTS, ...(data ?? {}), event_id: eventId } as HomePageContent;
}

export async function getEventPageContent(eventId = DEFAULT_HOME_EVENT_ID): Promise<EventPageContent> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("event_page_content")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    return normalizeEventPageContent(data as DbEventPageContent | null, eventId);
  }, EVENT_PAGE_CONTENT_DEFAULTS);
}

export async function updateEventPageContent(
  eventId: string,
  patch: Partial<EventPageContent>,
  adminId?: string
): Promise<EventPageContent> {
  const fallbackGallery = parseJsonField(EVENT_PAGE_CONTENT_DEFAULTS.gallery_json, []);
  const fallbackAttractions = parseJsonField(EVENT_PAGE_CONTENT_DEFAULTS.attractions_json, []);
  const fallbackSchedule = parseJsonField(EVENT_PAGE_CONTENT_DEFAULTS.schedule_json, []);
  const fallbackExtra = parseJsonField(EVENT_PAGE_CONTENT_DEFAULTS.extra_info_json, []);

  const payload: Partial<DbEventPageContent> = {
    event_id: eventId,
    hero_eyebrow: patch.hero_eyebrow ?? EVENT_PAGE_CONTENT_DEFAULTS.hero_eyebrow,
    title: patch.title ?? EVENT_PAGE_CONTENT_DEFAULTS.title,
    subtitle: patch.subtitle ?? EVENT_PAGE_CONTENT_DEFAULTS.subtitle,
    description: patch.description ?? EVENT_PAGE_CONTENT_DEFAULTS.description,
    hero_image_url: patch.hero_image_url ?? null,
    gallery_json: parseJsonField(patch.gallery_json ?? EVENT_PAGE_CONTENT_DEFAULTS.gallery_json, fallbackGallery),
    map_embed_url: patch.map_embed_url ?? null,
    map_link_url: patch.map_link_url ?? null,
    venue_notes: patch.venue_notes ?? EVENT_PAGE_CONTENT_DEFAULTS.venue_notes,
    attractions_json: parseJsonField(patch.attractions_json ?? EVENT_PAGE_CONTENT_DEFAULTS.attractions_json, fallbackAttractions),
    schedule_json: parseJsonField(patch.schedule_json ?? EVENT_PAGE_CONTENT_DEFAULTS.schedule_json, fallbackSchedule),
    food_bar_text: patch.food_bar_text ?? EVENT_PAGE_CONTENT_DEFAULTS.food_bar_text,
    bathrooms_text: patch.bathrooms_text ?? EVENT_PAGE_CONTENT_DEFAULTS.bathrooms_text,
    security_text: patch.security_text ?? EVENT_PAGE_CONTENT_DEFAULTS.security_text,
    extra_info_json: parseJsonField(patch.extra_info_json ?? EVENT_PAGE_CONTENT_DEFAULTS.extra_info_json, fallbackExtra),
    updated_by_admin_id: adminId ?? null,
  };

  const { data, error } = await (supabase as any)
    .from("event_page_content")
    .upsert(payload, { onConflict: "event_id" })
    .select("*")
    .single();

  if (error) throw error;
  await writeAudit("update_event_page_content", "event_page_content", eventId, { patch }).catch(() => {});
  return normalizeEventPageContent(data as DbEventPageContent, eventId);
}


// ─── EVENTS ───────────────────────────────────────────────────────────────────

export async function getEvent(slug = "turma-2006-20-anos"): Promise<DbEvent | null> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data as DbEvent;
  }, null);
}

export async function updateEvent(id: string, patch: Partial<DbEvent>): Promise<void> {
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit("update_event", "events", id, { patch });
}

// ─── PEOPLE ───────────────────────────────────────────────────────────────────

export async function getPeople(filters?: {
  search?: string;
  status?: string;
  classGroup?: string;
}): Promise<DbPerson[]> {
  return withFallback(async () => {
    let q = supabase.from("people").select("*").order("full_name");
    if (filters?.search) q = q.ilike("full_name", `%${filters.search}%`);
    if (filters?.status && filters.status !== "all") q = q.eq("profile_status", filters.status as any);
    if (filters?.classGroup) q = q.eq("class_group", filters.classGroup);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbPerson[]) ?? [];
  }, MOCK_PEOPLE);
}

export async function getPublicPeople(): Promise<DbPerson[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("is_visible", true)
      .order("full_name");
    if (error) throw error;
    return (data as DbPerson[]) ?? [];
  }, MOCK_PEOPLE.filter(p => p.is_visible));
}

export async function getAttendanceIntentPersonIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("person_id")
    .eq("intends_to_attend", true);
  if (error) throw error;
  return new Set(
    ((data ?? []) as { person_id?: string | null }[])
      .map(row => row.person_id)
      .filter((personId): personId is string => Boolean(personId)),
  );
}


export interface AdminImportPersonInput {
  full_name: string;
  display_name?: string | null;
  gender?: Gender | null;
  birth_year: number | null;
  class_group: string | null;
  avatar_url?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
}

function normalizeImportPerson(row: AdminImportPersonInput) {
  return {
    full_name: row.full_name.trim(),
    display_name: row.display_name?.trim() || null,
    gender: row.gender ?? null,
    birth_year: row.birth_year ?? null,
    class_group: row.class_group?.trim() || null,
    avatar_url: row.avatar_url?.trim() || null,
    contact_whatsapp: row.contact_whatsapp?.trim() || null,
    contact_email: row.contact_email?.trim() || null,
  };
}

export async function importPeopleAdmin(rows: AdminImportPersonInput[], adminId?: string): Promise<DbPerson[]> {
  const payload = rows
    .map(normalizeImportPerson)
    .filter(row => row.full_name && row.birth_year && row.class_group);

  if (payload.length === 0) throw new Error("Informe pelo menos uma pessoa com nome completo, ano de nascimento e turma.");

  const { data, error } = await (supabase as any).rpc("admin_import_people", {
    p_people: payload,
  });
  if (error) throw error;

  await writeAudit("admin_import_people", "people", null, {
    count: payload.length,
    admin_id: adminId ?? null,
  }).catch(() => {});

  return (data as DbPerson[]) ?? [];
}

export interface AdminPersonProfileDraft {
  display_name?: string | null;
  current_photo_url?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  current_country?: string | null;
  profession?: string | null;
  bio?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  relationship_status?: "single" | "dating" | "married" | null;
  has_children?: boolean | null;
  children_count?: number | null;
  intends_to_attend?: boolean | null;
  show_current_photo?: boolean | null;
  show_city?: boolean | null;
  show_profession?: boolean | null;
  show_social_links?: boolean | null;
  allow_photo_tags?: boolean | null;
  show_confirmed_status?: boolean | null;
}

export interface AdminPersonDetails {
  person: DbPerson;
  profile: DbProfile | null;
}

export async function getAdminPersonDetails(personId: string): Promise<AdminPersonDetails> {
  const { data, error } = await (supabase as any).rpc("admin_get_person_details", {
    p_person_id: personId,
  });
  if (error) throw error;
  return data as AdminPersonDetails;
}

export async function updateAdminPersonAndProfile(params: {
  personId: string;
  person: Partial<DbPerson>;
  profile?: AdminPersonProfileDraft | null;
  adminId?: string | null;
}): Promise<AdminPersonDetails> {
  const { data, error } = await (supabase as any).rpc("admin_update_person_and_profile", {
    p_person_id: params.personId,
    p_person: params.person,
    p_profile: params.profile ?? {},
  });
  if (error) throw error;

  await writeAudit("admin_update_person", "people", params.personId, {
    person_fields: Object.keys(params.person ?? {}),
    profile_fields: Object.keys(params.profile ?? {}),
    admin_id: params.adminId ?? null,
  }).catch(() => {});

  return data as AdminPersonDetails;
}

export interface CompleteProfileRegistrationParams {
  personId: string;
  penultimateSurname: string;
  classGroupConfirmation: string;
  birthYear: number;
  fullName?: string | null;
  displayName?: string | null;
  classGroup?: string | null;
  currentPhotoUrl?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  currentCountry?: string | null;
  profession?: string | null;
  bio?: string | null;
  nicknameAtSchool?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  contactEmail?: string | null;
  contactWhatsapp?: string | null;
  relationshipStatus?: "single" | "dating" | "married" | null;
  hasChildren?: boolean;
  childrenCount?: number | null;
  intendsToAttend?: boolean | null;
  showCurrentPhoto?: boolean;
  showCity?: boolean;
  showProfession?: boolean;
  showSocialLinks?: boolean;
  allowPhotoTags?: boolean;
  showConfirmedStatus?: boolean;
}

export async function completeProfileRegistration(params: CompleteProfileRegistrationParams): Promise<DbProfile> {
  const { data, error } = await (supabase as any).rpc("complete_profile_registration_v2", {
    p_person_id: params.personId,
    p_penultimate_surname: params.penultimateSurname,
    p_class_group_confirmation: params.classGroupConfirmation,
    p_birth_year: params.birthYear,
    p_full_name: params.fullName ?? null,
    p_display_name: params.displayName ?? null,
    p_class_group: params.classGroup ?? null,
    p_current_photo_url: params.currentPhotoUrl ?? null,
    p_current_city: params.currentCity ?? null,
    p_current_state: params.currentState ?? null,
    p_current_country: params.currentCountry ?? "Brasil",
    p_profession: params.profession ?? null,
    p_bio: params.bio ?? null,
    p_nickname_at_school: params.nicknameAtSchool ?? null,
    p_instagram_url: params.instagramUrl ?? null,
    p_linkedin_url: params.linkedinUrl ?? null,
    p_contact_email: params.contactEmail ?? null,
    p_contact_whatsapp: params.contactWhatsapp ?? null,
    p_relationship_status: params.relationshipStatus ?? null,
    p_has_children: params.hasChildren ?? false,
    p_children_count: params.childrenCount ?? null,
    p_intends_to_attend: params.intendsToAttend ?? null,
    p_show_current_photo: params.showCurrentPhoto ?? true,
    p_show_city: params.showCity ?? true,
    p_show_profession: params.showProfession ?? true,
    p_show_social_links: params.showSocialLinks ?? false,
    p_allow_photo_tags: params.allowPhotoTags ?? true,
    p_show_confirmed_status: params.showConfirmedStatus ?? true,
  });
  if (error) throw error;
  await writeAudit("complete_profile_registration", "profiles", (data as DbProfile)?.id ?? null, {
    person_id: params.personId,
  }).catch(() => {});
  return data as DbProfile;
}

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export async function getMyProfile(userId: string): Promise<(DbProfile & { people?: Partial<DbPerson> }) | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, people(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as (DbProfile & { people?: Partial<DbPerson> }) | null;
}

export async function saveMyProfile(userId: string, patch: Partial<DbProfile>): Promise<DbProfile> {
  const current = await getMyProfile(userId);
  if (!current?.id) {
    throw new Error("Perfil ainda não reivindicado. Reivindique seu perfil antes de editar os dados públicos.");
  }
  const allowedPatch: Partial<DbProfile> = {
    display_name: patch.display_name ?? current.display_name,
    current_photo_url: patch.current_photo_url ?? current.current_photo_url,
    current_city: patch.current_city ?? current.current_city,
    current_state: patch.current_state ?? current.current_state,
    current_country: patch.current_country ?? current.current_country,
    profession: patch.profession ?? current.profession,
    bio: patch.bio ?? current.bio,
    memory_text: patch.memory_text ?? current.memory_text,
    instagram_url: patch.instagram_url ?? current.instagram_url,
    linkedin_url: patch.linkedin_url ?? current.linkedin_url,
    contact_email: patch.contact_email ?? current.contact_email,
    contact_whatsapp: patch.contact_whatsapp ?? current.contact_whatsapp,
    relationship_status: patch.relationship_status ?? current.relationship_status,
    has_children: patch.has_children ?? current.has_children,
    children_count: patch.children_count ?? current.children_count,
    intends_to_attend: patch.intends_to_attend ?? current.intends_to_attend,
    show_current_photo: patch.show_current_photo ?? current.show_current_photo,
    show_city: patch.show_city ?? current.show_city,
    show_profession: patch.show_profession ?? current.show_profession,
    show_social_links: patch.show_social_links ?? current.show_social_links,
    allow_photo_tags: patch.allow_photo_tags ?? current.allow_photo_tags,
    show_confirmed_status: patch.show_confirmed_status ?? current.show_confirmed_status,
  };
  const { data, error } = await supabase
    .from("profiles")
    .update(allowedPatch)
    .eq("id", current.id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  await writeAudit("update_profile", "profiles", current.id, { fields: Object.keys(allowedPatch) });
  return data as DbProfile;
}

export async function getClassmates(classGroup?: string | null, currentPersonId?: string | null): Promise<DbPerson[]> {
  if (!classGroup) return [];
  return withFallback(async () => {
    let q = supabase
      .from("people")
      .select("*")
      .eq("class_group", classGroup)
      .eq("is_visible", true)
      .order("full_name")
      .limit(8);
    if (currentPersonId) q = q.neq("id", currentPersonId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbPerson[]) ?? [];
  }, []);
}


export async function getPublicProfileCardByPersonId(personId: string): Promise<PublicProfileCardRow | null> {
  if (!personId) return null;

  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("public_profile_cards")
      .select("*")
      .eq("person_id", personId)
      .maybeSingle();

    if (error) throw error;
    return data as PublicProfileCardRow | null;
  }, null);
}

export async function getAlumniDirectoryStatuses(eventId = DEFAULT_HOME_EVENT_ID): Promise<AlumniDirectoryStatusRow[]> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("public_alumni_directory_status")
      .select("*")
      .eq("event_id", eventId)
      .order("full_name", { ascending: true });

    if (error) throw error;
    return ((data as AlumniDirectoryStatusRow[]) ?? []).filter(row => row);
  }, []);
}

export async function saveSchoolQuestionnaireAnswers(params: {
  eventId?: string;
  profileId: string;
  personId: string;
  answers: Record<string, string[]>;
}): Promise<void> {
  const rows = Object.entries(params.answers)
    .map(([questionId, options]) => ({
      event_id: params.eventId ?? DEFAULT_HOME_EVENT_ID,
      profile_id: params.profileId,
      person_id: params.personId,
      question_id: questionId,
      selected_options_json: Array.from(new Set((options ?? []).map(option => option.trim()).filter(Boolean))),
      updated_at: new Date().toISOString(),
    }))
    .filter(row => row.question_id && row.selected_options_json.length > 0);

  if (!rows.length) return;

  const { error } = await (supabase as any)
    .from("profile_school_questionnaire_answers")
    .upsert(rows, { onConflict: "profile_id,question_id" });
  if (error) throw error;
}

export async function getSchoolQuestionnaireOptionStats(eventId = DEFAULT_HOME_EVENT_ID): Promise<SchoolQuestionnaireOptionStatRow[]> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("public_school_questionnaire_option_stats")
      .select("*")
      .eq("event_id", eventId)
      .order("answer_count", { ascending: false });
    if (error) throw error;
    return (data as SchoolQuestionnaireOptionStatRow[]) ?? [];
  }, []);
}

export async function getCuriosityProfileStats(eventId = DEFAULT_HOME_EVENT_ID): Promise<CuriosityProfileStatsRow | null> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any)
      .from("public_curiosity_profile_stats")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data as CuriosityProfileStatsRow | null;
  }, null);
}

export async function saveMyPublicProfile(
  userId: string,
  profilePatch: Partial<DbProfile>,
  peoplePatch: Pick<Partial<DbPerson>, "nickname_at_school" | "avatar_url"> = {}
): Promise<DbProfile & { people?: Partial<DbPerson> | null }> {
  const current = await getMyProfile(userId);
  if (!current?.id) {
    throw new Error("Perfil ainda não reivindicado. Reivindique seu perfil antes de editar os dados públicos.");
  }

  const profileKeys: (keyof DbProfile)[] = [
    "display_name",
    "current_photo_url",
    "current_city",
    "current_state",
    "current_country",
    "profession",
    "bio",
    "memory_text",
    "instagram_url",
    "linkedin_url",
    "contact_email",
    "contact_whatsapp",
    "relationship_status",
    "has_children",
    "children_count",
    "intends_to_attend",
    "show_current_photo",
    "show_city",
    "show_profession",
    "show_social_links",
    "allow_photo_tags",
    "show_confirmed_status",
  ];
  const allowedProfilePatch = profileKeys.reduce<Partial<DbProfile>>((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(profilePatch, key)) {
      (acc as any)[key] = profilePatch[key];
    }
    return acc;
  }, {});

  let updatedProfile: DbProfile = current;
  if (Object.keys(allowedProfilePatch).length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .update(allowedProfilePatch)
      .eq("id", current.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    updatedProfile = data as DbProfile;
  }

  const peopleKeys: (keyof Pick<DbPerson, "nickname_at_school" | "avatar_url">)[] = ["nickname_at_school", "avatar_url"];
  const allowedPeoplePatch = peopleKeys.reduce<Partial<DbPerson>>((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(peoplePatch, key)) {
      (acc as any)[key] = peoplePatch[key];
    }
    return acc;
  }, {});

  let updatedPeople = current.people ?? null;
  if (Object.keys(allowedPeoplePatch).length > 0) {
    const rpcPatch: Record<string, string> = {};
    if (Object.prototype.hasOwnProperty.call(allowedPeoplePatch, "nickname_at_school")) {
      rpcPatch.p_nickname_at_school = allowedPeoplePatch.nickname_at_school ?? "";
    }
    if (Object.prototype.hasOwnProperty.call(allowedPeoplePatch, "avatar_url")) {
      rpcPatch.p_avatar_url = allowedPeoplePatch.avatar_url ?? "";
    }
    const { error } = await (supabase as any).rpc("update_my_public_profile", rpcPatch);
    if (error) throw error;
    updatedPeople = (await getMyProfile(userId))?.people ?? null;
  }

  await writeAudit("update_public_profile", "profiles", current.id, {
    profile_fields: Object.keys(allowedProfilePatch),
    people_fields: Object.keys(allowedPeoplePatch),
  }).catch(() => {});

  return { ...updatedProfile, people: updatedPeople };
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem valida.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no maximo 5 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Nao foi possivel gerar a URL do avatar.");
  return data.publicUrl;
}

export async function uploadAdminPersonAvatar(adminId: string, file: File, personId?: string | null): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem valida.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no maximo 5 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const owner = personId || adminId;
  const path = `admin-people/${adminId}/${owner}-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Nao foi possivel gerar a URL da foto.");
  return data.publicUrl;
}

export async function uploadHeaderLogo(file: File, adminId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem valida.");
  if (file.size > 2 * 1024 * 1024) throw new Error("O logo deve ter no maximo 2 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "png";
  const path = `${adminId}/header-logo-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Nao foi possivel gerar a URL do logo.");

  await writeAudit("upload_header_logo", "home_page_content", DEFAULT_HOME_EVENT_ID, { path, admin_id: adminId }).catch(() => {});
  return data.publicUrl;
}

export async function uploadFavicon(file: File, adminId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["ico", "jpg", "jpeg", "png", "svg", "webp"].includes(ext) ? ext : "png";
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
  const isAllowedMimeType = file.type ? allowedMimeTypes.includes(file.type) || file.type.startsWith("image/") : true;

  if (!isAllowedMimeType) throw new Error("Selecione uma imagem valida para favicon.");
  if (file.size > 1024 * 1024) throw new Error("O favicon deve ter no maximo 1 MB.");

  const contentType = file.type || (safeExt === "ico" ? "image/x-icon" : safeExt === "svg" ? "image/svg+xml" : "image/png");
  const path = `${adminId}/favicon-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Nao foi possivel gerar a URL do favicon.");

  await writeAudit("upload_favicon", "home_page_content", DEFAULT_HOME_EVENT_ID, { path, admin_id: adminId }).catch(() => {});
  return data.publicUrl;
}

export async function upsertProfile(profile: UpsertProfile) {
  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "user_id" });
  if (error) throw error;
}

// ─── TICKET TYPES ─────────────────────────────────────────────────────────────

export async function getTicketTypes(eventId?: string): Promise<DbTicketType[]> {
  return withFallback(async () => {
    let q = supabase.from("ticket_types").select("*").order("price_cents");
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbTicketType[]) ?? [];
  }, MOCK_TICKET_TYPES);
}

export async function updateTicketType(id: string, patch: Partial<DbTicketType>) {
  const { error } = await supabase.from("ticket_types").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit("update_ticket_type", "ticket_types", id, { patch });
}

export async function createTicketType(data: Partial<DbTicketType>) {
  const { data: row, error } = await supabase.from("ticket_types").insert(data).select().single();
  if (error) throw error;
  await writeAudit("create_ticket_type", "ticket_types", (row as DbTicketType).id, {});
  return row as DbTicketType;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function createOrder(order: InsertOrder): Promise<DbOrder> {
  const { data, error } = await supabase.from("orders").insert(order).select().single();
  if (error) throw error;
  return data as DbOrder;
}

export async function getEventArchiveSettings(eventId: string): Promise<DbEventArchiveSettings | null> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("event_archive_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data as DbEventArchiveSettings | null;
  }, null);
}

export async function createCheckoutOrder(params: {
  ticket_type_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  person_id?: string | null;
  quantity?: number;
}): Promise<DbOrder> {
  const { order } = await callFunction<{ order: DbOrder }>("/orders", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return order;
}

export async function createPaymentPreference(orderId: string): Promise<{
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
  dev_mode?: boolean;
}> {
  return callFunction("/mp/preference", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export async function getCheckoutOrder(orderId: string): Promise<DbOrder & {
  ticket_types?: Partial<DbTicketType> | null;
  tickets?: { id: string; qr_code: string }[];
}> {
  const { order } = await callFunction<{ order: DbOrder & {
    ticket_types?: Partial<DbTicketType> | null;
    tickets?: { id: string; qr_code: string }[];
  } }>(`/orders/${orderId}`);
  return order;
}

export async function getMyOrder(email: string): Promise<DbOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as DbOrder | null;
}

export async function getOrdersByStatus(status?: string): Promise<DbOrder[]> {
  return withFallback(async () => {
    const { data, error } = await (supabase as any).rpc("get_admin_orders", {
      p_status: status ? status : null,
    });

    if (error) throw error;
    return (data as DbOrder[]) ?? [];
  }, []);
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────

export async function getMyTicket(email: string): Promise<DbTicket | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, orders(*), ticket_types(*)")
    .eq("attendee_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as DbTicket | null;
}

// Check-in helper preservado para compatibilidade com fluxos antigos.
export async function checkInTicket(ticketId: string, adminUserId: string): Promise<void> {
  await markTicketCheckedIn(ticketId, adminUserId);
}

// ─── PHOTOS ───────────────────────────────────────────────────────────────────

export async function getApprovedPhotos(eventId?: string): Promise<DbPhoto[]> {
  return withFallback(async () => {
    let q = supabase
      .from("photos")
      .select("*, photo_tags(person_id, tagged_name_snapshot, status)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbPhoto[]) ?? [];
  }, []);
}

export async function getMyUploadedPhotos(userId: string): Promise<DbPhoto[]> {
  if (!userId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("uploaded_by_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DbPhoto[]) ?? [];
  }, []);
}

export async function getMyTaggedPhotos(personId: string): Promise<DbPhoto[]> {
  if (!personId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("photo_tags")
      .select("*, photos(*)")
      .eq("person_id", personId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as (DbPhotoTag & { photos?: DbPhoto | null })[])
      .map(row => row.photos)
      .filter((photo): photo is DbPhoto => Boolean(photo));
  }, []);
}

export async function getPendingPhotos(): Promise<DbPhoto[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DbPhoto[]) ?? [];
  }, []);
}

export async function uploadPhoto(params: {
  file: File;
  userId: string;
  userName: string;
  caption: string;
  yearApprox: number;
  locationText: string;
  eventId: string;
  tags?: { personId: string; name: string }[];
}) {
  // 1. Faz upload no Storage
  const ext = params.file.name.split(".").pop();
  const path = `${params.userId}/${Date.now()}.${ext}`;
  const { error: storageError } = await supabase.storage
    .from("photos")
    .upload(path, params.file, { upsert: false });
  if (storageError) throw storageError;

  // 2. Gera signed URL para thumbnail (expiração longa)
  const { data: signedData } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 ano

  const imageUrl = signedData?.signedUrl ?? "";

  // 3. Insere registro na tabela photos
  const { data, error } = await supabase.from("photos").insert({
    event_id:             params.eventId,
    image_url:            imageUrl,
    storage_path:         path,
    caption:              params.caption,
    year_approx:          params.yearApprox,
    location_text:        params.locationText,
    uploaded_by_user_id:  params.userId,
    uploaded_by_name:     params.userName,
    authorization_given:  true,
    status:               "pending",
  }).select().single();
  if (error) throw error;
  const photo = data as DbPhoto;

  if (params.tags?.length) {
    const { error: tagError } = await supabase.from("photo_tags").insert(
      params.tags.map(tag => ({
        photo_id:              photo.id,
        person_id:             tag.personId,
        tagged_name_snapshot:  tag.name,
        status:                "pending" as const,
        created_by_user_id:    params.userId,
      }))
    );
    if (tagError) throw tagError;
  }

  await writeAudit("upload_photo", "photos", photo.id, {
    tags_count: params.tags?.length ?? 0,
    authorization_given: true,
  });
  return photo;
}

export async function moderatePhoto(id: string, action: "approved" | "rejected", adminId: string) {
  const patch = action === "approved"
    ? { status: "approved" as const, approved_by_admin_id: adminId, approved_at: new Date().toISOString() }
    : { status: "rejected" as const };
  const { error } = await supabase.from("photos").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit(`photo_${action}`, "photos", id, { admin_id: adminId });
}

// ─── PHOTO TAGS ───────────────────────────────────────────────────────────────

export async function getTagsForModeration(status = "pending"): Promise<(DbPhotoTag & { photos: Pick<DbPhoto, "image_url" | "caption"> | null })[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("photo_tags")
      .select("*, photos(image_url, caption), people(full_name)")
      .eq("status", status as any)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function moderateTag(id: string, action: "approved" | "rejected", adminId: string) {
  const patch = action === "approved"
    ? { status: "approved" as const, approved_by_admin_id: adminId, approved_at: new Date().toISOString() }
    : { status: "rejected" as const };
  const { error } = await supabase.from("photo_tags").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit(`tag_${action}`, "photo_tags", id, { admin_id: adminId });
}

export async function addPhotoTag(photoId: string, personId: string, taggedName: string, userId: string) {
  const { error } = await supabase.from("photo_tags").insert({
    photo_id:             photoId,
    person_id:            personId,
    tagged_name_snapshot: taggedName,
    status:               "pending",
    created_by_user_id:   userId,
  });
  if (error && !error.message.includes("duplicate")) throw error;
}

// ─── PROFILE CLAIMS ───────────────────────────────────────────────────────────

export async function createProfileClaim(data: {
  personId: string;
  userId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
}): Promise<DbProfileClaim> {
  const { data: row, error } = await supabase.from("profile_claims").insert({
    person_id:          data.personId,
    requester_user_id:  data.userId,
    requester_name:     data.requesterName,
    requester_email:    data.requesterEmail,
    requester_phone:    data.requesterPhone,
    status:             "pending",
  }).select().single();
  if (error) throw error;
  return row as DbProfileClaim;
}

export async function saveClaimAnswers(claimId: string, answers: { key: string; text: string; score: number }[]) {
  const rows = answers.map(a => ({
    claim_id:     claimId,
    question_key: a.key,
    answer_text:  a.text,
    score_value:  a.score,
  }));
  const { error } = await supabase.from("profile_claim_answers").insert(rows);
  if (error) throw error;
}

export async function getPendingClaims(): Promise<(DbProfileClaim & { people: Pick<DbPerson, "full_name" | "nickname_at_school" | "class_group"> | null })[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("profile_claims")
      .select("*, people(full_name, nickname_at_school, class_group)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function moderateClaim(
  claimId: string,
  action: "approved" | "rejected",
  adminId: string,
  reason?: string
) {
  if (action === "approved") {
    // 1. Aprova a solicitação
    const { data: claim, error: claimError } = await supabase
      .from("profile_claims")
      .update({ status: "approved", reviewed_by_admin_id: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", claimId)
      .select("person_id, requester_user_id, requester_name")
      .single();
    if (claimError) throw claimError;

    // 2. Vincula o perfil ao usuário
    await supabase.from("people").update({
      profile_status:      "claimed",
      claimed_by_user_id:  (claim as any).requester_user_id,
      claimed_at:          new Date().toISOString(),
    }).eq("id", (claim as any).person_id);

    // 3. Cria o profile básico
    await supabase.from("profiles").upsert({
      person_id:    (claim as any).person_id,
      user_id:      (claim as any).requester_user_id,
      display_name: (claim as any).requester_name,
    }, { onConflict: "user_id" });

  } else {
    await supabase.from("profile_claims").update({
      status:              "rejected",
      reviewed_by_admin_id: adminId,
      reviewed_at:         new Date().toISOString(),
      rejection_reason:    reason ?? null,
    }).eq("id", claimId);
  }
  await writeAudit(`claim_${action}`, "profile_claims", claimId, { admin_id: adminId });
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("admin_users").select("id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export async function getCurrentAdminUser(userId: string): Promise<DbAdminUser | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as DbAdminUser | null;
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

export async function writeAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id:       user?.id ?? null,
      action,
      entity_type:   entityType,
      entity_id:     entityId ?? undefined,
      metadata_json: metadata,
    });
  } catch {
    // Falha silenciosa — audit log não deve quebrar o fluxo principal
  }
}

// ─── TICKET TYPES (admin) ─────────────────────────────────────────────────────

export async function getTicketTypesAdmin(eventId?: string): Promise<DbTicketType[]> {
  return withFallback(async () => {
    let q = supabase.from("ticket_types").select("*").order("price_cents");
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbTicketType[]) ?? [];
  }, MOCK_TICKET_TYPES);
}

export async function updateTicketTypeStatus(id: string, status: TicketStatus, adminId: string) {
  const { error } = await supabase.from("ticket_types").update({ status }).eq("id", id);
  if (error) throw error;
  await writeAudit("update_lot_status", "ticket_types", id, { status, admin_id: adminId });
}

export async function updateTicketTypeFull(id: string, patch: Partial<DbTicketType>, adminId: string) {
  const { error } = await supabase.from("ticket_types").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit("update_lot", "ticket_types", id, { patch, admin_id: adminId });
}

// ─── EVENT SETTINGS ───────────────────────────────────────────────────────────

export async function getEventSettings(slug = "turma-2006-20-anos"): Promise<DbEvent | null> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (error) throw error;
    return data as DbEvent;
  }, null);
}

export async function updateEventSettings(id: string, patch: Partial<DbEvent>, adminId: string) {
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit("update_event_settings", "events", id, { fields: Object.keys(patch), admin_id: adminId });
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export async function getReports(eventId = DEFAULT_EVENT_ID): Promise<Record<string, number>> {
  return withFallback(async () => {
    const { data, error } = await supabase.rpc("get_event_reports", { p_event_id: eventId });
    if (error) throw error;
    return (data ?? {}) as Record<string, number>;
  }, {
    tickets_sold: 61, revenue_cents: 766000, orders_pending: 4,
    orders_approved: 55, orders_rejected: 2, orders_cancelled: 0,
    orders_expired: 0, orders_refunded: 0, checkins_done: 0, checkins_pending: 61,
    people_confirmed: 10, people_claimed: 4, people_unclaimed: 4,
    photos_total: 6, photos_approved: 6, photos_pending: 0, photos_rejected: 0,
    claims_pending: 0, disputes_pending: 0, removals_pending: 0,
  });
}

// ─── USER TICKETS ─────────────────────────────────────────────────────────────

export async function getMyOrders(userId: string, email?: string): Promise<DbOrder[]> {
  if (!userId && !email) return [];
  return withFallback(async () => {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (email) q = q.eq("buyer_email", email);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbOrder[]) ?? [];
  }, []);
}

export async function getMyTickets(userId: string, email?: string): Promise<TicketWithDetails[]> {
  if (!userId && !email) return [];
  return withFallback(async () => {
    const rows: TicketWithDetails[] = [];

    if (email) {
      const { data: direct, error: directError } = await supabase
        .from("tickets")
        .select("*, orders(*), ticket_types(*), people(full_name, nickname_at_school, class_group)")
        .eq("attendee_email", email)
        .order("created_at", { ascending: false });
      if (directError) throw directError;
      rows.push(...((direct ?? []) as unknown as TicketWithDetails[]));

      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("buyer_email", email);
      if (orderError) throw orderError;
      const orderIds = ((orders ?? []) as Pick<DbOrder, "id">[]).map(o => o.id);
      if (orderIds.length > 0) {
        const { data: byOrder, error: ticketError } = await supabase
          .from("tickets")
          .select("*, orders(*), ticket_types(*), people(full_name, nickname_at_school, class_group)")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });
        if (ticketError) throw ticketError;
        rows.push(...((byOrder ?? []) as unknown as TicketWithDetails[]));
      }
    }

    const unique = new Map<string, TicketWithDetails>();
    for (const row of rows) unique.set(row.id, row);
    return Array.from(unique.values()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }, []);
}

export async function getTicketDetails(ticketId: string): Promise<TicketWithDetails | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, orders(*), ticket_types(*), people(full_name, nickname_at_school, class_group)")
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as TicketWithDetails | null;
}

export async function findTicketForCheckin(query: string, mode: "qr" | "name" | "email" | "phone" = "qr"): Promise<TicketWithDetails | null> {
  const clean = query.trim();
  if (!clean) return null;
  return withFallback(async () => {
    let q = supabase
      .from("tickets")
      .select("*, orders(*), ticket_types(*), people(full_name, nickname_at_school, class_group)")
      .limit(10);
    if (mode === "qr") {
      q = q.eq("qr_code", clean.toUpperCase());
    } else if (mode === "email") {
      q = q.ilike("attendee_email", clean);
    } else if (mode === "phone") {
      q = q.ilike("attendee_phone", `%${clean}%`);
    } else {
      q = q.ilike("attendee_name", `%${clean}%`);
    }
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as TicketWithDetails[])[0] ?? null;
  }, null);
}

export async function markTicketCheckedIn(ticketId: string, adminId: string): Promise<TicketWithDetails> {
  const current = await getTicketDetails(ticketId);
  if (!current) throw new Error("Ingresso não encontrado.");
  if (current.checked_in) throw new Error("Este ingresso já registrou entrada.");
  if (current.orders?.payment_status !== "approved") throw new Error("Pagamento não aprovado. Entrada não autorizada.");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tickets")
    .update({ checked_in: true, checked_in_at: now, checked_in_by_admin_id: adminId })
    .eq("id", ticketId)
    .eq("checked_in", false)
    .select("*, orders(*), ticket_types(*), people(full_name, nickname_at_school, class_group)")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Não foi possível registrar: ingresso já utilizado ou indisponível.");
  await writeAudit("ticket_checkin", "tickets", ticketId, { admin_id: adminId, checked_in_at: now });
  return data as unknown as TicketWithDetails;
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────

export function exportToCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape  = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportPeopleCSV() {
  const people = await getPeople();
  exportToCsv(people.map(p => ({
    nome:    p.full_name,
    apelido: p.nickname_at_school ?? "",
    sala:    p.class_group ?? "",
    status:  p.profile_status,
  })), "ex-alunos.csv");
}

export async function exportOrdersCSV(eventId = DEFAULT_EVENT_ID) {
  const { data } = await supabase.from("orders")
    .select("*, ticket_types(name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  exportToCsv((data ?? []).map((o: any) => ({
    codigo: o.id, nome: o.buyer_name, email: o.buyer_email,
    telefone: o.buyer_phone ?? "", ingresso: o.ticket_types?.name ?? "",
    valor: `R$ ${(o.total_amount_cents / 100).toFixed(2)}`,
    status: o.payment_status, data: o.created_at?.slice(0, 10) ?? "",
  })), "pedidos.csv");
}

export async function exportTicketsCSV(eventId = DEFAULT_EVENT_ID) {
  const { data } = await supabase.from("tickets")
    .select("*, orders!inner(event_id, payment_status), ticket_types(name)")
    .eq("orders.event_id", eventId);
  exportToCsv((data ?? []).map((t: any) => ({
    codigo: t.qr_code, nome: t.attendee_name, email: t.attendee_email,
    telefone: t.attendee_phone ?? "", ingresso: t.ticket_types?.name ?? "",
    acompanhante: t.guest_name ?? "", checkin: t.checked_in ? "Sim" : "Não",
    checkin_hora: t.checked_in_at?.slice(0, 16)?.replace("T", " ") ?? "",
  })), "ingressos.csv");
}


// ─── PHASE 2: LIKES, COMMENTS E MEMÓRIAS ─────────────────────────────────────

export async function likePhoto(photoId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("photo_likes").insert({ photo_id: photoId, user_id: userId });
  if (error && !String(error.message ?? "").toLowerCase().includes("duplicate")) throw error;
}

export async function unlikePhoto(photoId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("photo_likes").delete().eq("photo_id", photoId).eq("user_id", userId);
  if (error) throw error;
}

export async function getPhotoLikes(photoIds: string[]): Promise<Record<string, number>> {
  if (photoIds.length === 0) return {};
  return withFallback(async () => {
    const { data, error } = await supabase.from("photo_likes").select("photo_id").in("photo_id", photoIds);
    if (error) throw error;
    return ((data as Pick<DbPhotoLike, "photo_id">[]) ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.photo_id] = (acc[row.photo_id] ?? 0) + 1;
      return acc;
    }, {});
  }, {});
}

export async function getMyPhotoLikes(userId: string): Promise<string[]> {
  if (!userId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase.from("photo_likes").select("photo_id").eq("user_id", userId);
    if (error) throw error;
    return ((data as Pick<DbPhotoLike, "photo_id">[]) ?? []).map(row => row.photo_id);
  }, []);
}

export async function createPhotoComment(params: {
  photoId: string;
  userId: string;
  authorName: string;
  commentText: string;
}): Promise<DbPhotoComment> {
  const { data, error } = await supabase.from("photo_comments").insert({
    photo_id:     params.photoId,
    user_id:      params.userId,
    author_name:  params.authorName,
    comment_text: params.commentText,
    status:       "pending",
  }).select().single();
  if (error) throw error;
  await writeAudit("create_photo_comment", "photo_comments", (data as DbPhotoComment).id, { photo_id: params.photoId });
  return data as DbPhotoComment;
}

export async function getApprovedPhotoComments(photoId: string): Promise<DbPhotoComment[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("photo_comments")
      .select("*")
      .eq("photo_id", photoId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as DbPhotoComment[]) ?? [];
  }, []);
}

export async function getPhotoCommentsForModeration(status: ModerationStatus | "all" = "pending"): Promise<(DbPhotoComment & { photos?: Partial<DbPhoto> })[]> {
  return withFallback(async () => {
    let q = supabase.from("photo_comments")
      .select("*, photos(image_url, caption, year_approx)")
      .order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function moderatePhotoComment(id: string, status: ModerationStatus, adminId: string): Promise<void> {
  const patch = status === "approved"
    ? { status, approved_by_admin_id: adminId, approved_at: new Date().toISOString() }
    : { status, approved_by_admin_id: adminId, approved_at: null };
  const { error } = await supabase.from("photo_comments").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit(`photo_comment_${status}`, "photo_comments", id, { admin_id: adminId });
}

export async function getPhotoCommentCounts(photoIds: string[]): Promise<Record<string, number>> {
  if (photoIds.length === 0) return {};
  return withFallback(async () => {
    const { data, error } = await supabase.from("photo_comments")
      .select("photo_id")
      .in("photo_id", photoIds)
      .eq("status", "approved");
    if (error) throw error;
    return ((data as Pick<DbPhotoComment, "photo_id">[]) ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.photo_id] = (acc[row.photo_id] ?? 0) + 1;
      return acc;
    }, {});
  }, {});
}

export async function getFeaturedOrPopularPhotos(eventId = DEFAULT_EVENT_ID): Promise<DbPhoto[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("photos")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data as DbPhoto[]) ?? [];
  }, []);
}

export async function toggleFeaturedPhoto(photoId: string, featured: boolean, adminId: string): Promise<void> {
  const patch = featured
    ? { is_featured: true, featured_by_admin_id: adminId, featured_at: new Date().toISOString() }
    : { is_featured: false, featured_by_admin_id: null, featured_at: null };
  const { error } = await supabase.from("photos").update(patch).eq("id", photoId);
  if (error) throw error;
  await writeAudit(featured ? "feature_photo" : "unfeature_photo", "photos", photoId, { admin_id: adminId });
}

export async function createMemory(params: {
  eventId: string;
  userId: string;
  personId?: string | null;
  authorName: string;
  memoryText: string;
  isAnonymous: boolean;
}): Promise<DbMemory> {
  const { data, error } = await supabase.from("memories").insert({
    event_id:      params.eventId,
    user_id:       params.userId,
    person_id:     params.personId ?? null,
    author_name:   params.authorName,
    memory_text:   params.memoryText,
    is_anonymous:  params.isAnonymous,
    status:        "pending",
    is_featured:   false,
  }).select().single();
  if (error) throw error;
  await writeAudit("create_memory", "memories", (data as DbMemory).id, {});
  return data as DbMemory;
}

export async function getApprovedMemories(eventId = DEFAULT_EVENT_ID, featuredOnly = false): Promise<DbMemory[]> {
  return withFallback(async () => {
    let q = supabase.from("memories")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (featuredOnly) q = q.eq("is_featured", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbMemory[]) ?? [];
  }, []);
}

export async function getMyMemories(userId: string): Promise<DbMemory[]> {
  if (!userId) return [];
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data as DbMemory[]) ?? [];
  }, []);
}

export async function getMemoriesForModeration(status: ModerationStatus | "all" = "pending"): Promise<DbMemory[]> {
  return withFallback(async () => {
    let q = supabase.from("memories").select("*").order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbMemory[]) ?? [];
  }, []);
}

export async function moderateMemory(id: string, status: ModerationStatus, adminId: string): Promise<void> {
  const patch = status === "approved"
    ? { status, approved_by_admin_id: adminId, approved_at: new Date().toISOString() }
    : { status, approved_by_admin_id: adminId, approved_at: null };
  const { error } = await supabase.from("memories").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit(`memory_${status}`, "memories", id, { admin_id: adminId });
}

export async function toggleFeaturedMemory(id: string, featured: boolean, adminId: string): Promise<void> {
  const { error } = await supabase.from("memories").update({ is_featured: featured }).eq("id", id);
  if (error) throw error;
  await writeAudit(featured ? "feature_memory" : "unfeature_memory", "memories", id, { admin_id: adminId });
}

export async function getPhotoStats(photoIds: string[]): Promise<Record<string, PhotoStats>> {
  const [likes, comments] = await Promise.all([getPhotoLikes(photoIds), getPhotoCommentCounts(photoIds)]);
  return photoIds.reduce<Record<string, PhotoStats>>((acc, photoId) => {
    acc[photoId] = { photo_id: photoId, likes_count: likes[photoId] ?? 0, comments_count: comments[photoId] ?? 0 };
    return acc;
  }, {});
}


// ─── POLLS ───────────────────────────────────────────────────────────────────

export async function getPolls(eventId = DEFAULT_EVENT_ID, includeAdmin = false): Promise<(DbPoll & { poll_options?: DbPollOption[] })[]> {
  return withFallback(async () => {
    let q = supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (!includeAdmin) q = (q as any).in("status", ["open", "closed"]);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function getPollWithOptions(pollId: string): Promise<(DbPoll & { poll_options?: DbPollOption[] }) | null> {
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("id", pollId)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function getPollResults(pollId: string): Promise<Record<string, number>> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("poll_results")
      .select("option_id, votes_count")
      .eq("poll_id", pollId);
    if (error) throw error;
    return ((data ?? []) as PollResultRow[]).reduce<Record<string, number>>((acc, row) => {
      acc[row.option_id] = row.votes_count;
      return acc;
    }, {});
  }, {});
}

export async function getMyPollVotes(userId: string, pollIds?: string[]): Promise<DbPollVote[]> {
  if (!userId) return [];
  return withFallback(async () => {
    let q = supabase.from("poll_votes").select("*").eq("user_id", userId);
    if (pollIds?.length) q = (q as any).in("poll_id", pollIds);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DbPollVote[];
  }, []);
}

export async function votePoll(params: { pollId: string; optionId: string; userId: string; allowMultiple?: boolean }): Promise<void> {
  if (!params.allowMultiple) {
    await supabase.from("poll_votes").delete().eq("poll_id", params.pollId).eq("user_id", params.userId);
  }
  const { error } = await supabase.from("poll_votes").insert({
    poll_id: params.pollId,
    option_id: params.optionId,
    user_id: params.userId,
  });
  if (error) throw error;
  await writeAudit("vote_poll", "poll_votes", null, { poll_id: params.pollId, option_id: params.optionId });
}

export async function createPoll(params: {
  eventId?: string; question: string; description?: string; status?: PollStatus;
  allowMultipleVotes?: boolean; options: string[]; adminId: string;
}): Promise<DbPoll> {
  const { data: poll, error } = await supabase.from("polls").insert({
    event_id: params.eventId ?? DEFAULT_EVENT_ID,
    question: params.question,
    description: params.description ?? null,
    status: params.status ?? "draft",
    allow_multiple_votes: params.allowMultipleVotes ?? false,
    created_by_admin_id: params.adminId,
  }).select().single();
  if (error) throw error;
  const pollRow = poll as DbPoll;
  const options = params.options.map((option, idx) => ({
    poll_id: pollRow.id,
    option_text: option,
    sort_order: idx,
  })).filter(o => o.option_text.trim().length > 0);
  if (options.length) {
    const { error: optErr } = await supabase.from("poll_options").insert(options);
    if (optErr) throw optErr;
  }
  await writeAudit("create_poll", "polls", pollRow.id, { options_count: options.length, admin_id: params.adminId });
  return pollRow;
}

export async function updatePoll(id: string, patch: Partial<DbPoll>, adminId: string): Promise<void> {
  const { error } = await supabase.from("polls").update(patch).eq("id", id);
  if (error) throw error;
  await writeAudit("update_poll", "polls", id, { fields: Object.keys(patch), admin_id: adminId });
}

export async function closePoll(id: string, adminId: string): Promise<void> {
  await updatePoll(id, { status: "closed" as PollStatus }, adminId);
}

export async function archivePoll(id: string, adminId: string): Promise<void> {
  await updatePoll(id, { status: "archived" as PollStatus }, adminId);
}

// ─── PUBLIC LOCATION MAP ─────────────────────────────────────────────────────

export async function getPublicLocationStats(): Promise<LocationStat[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("public_profile_locations")
      .select("*")
      .order("current_country")
      .order("current_state")
      .order("current_city");
    if (error) throw error;
    const rows = (data ?? []) as PublicLocationRow[];
    const map = new Map<string, LocationStat>();
    for (const row of rows) {
      const key = [row.current_city, row.current_state ?? "", row.current_country ?? "Brasil"].join("|");
      const current = map.get(key) ?? {
        key,
        city: row.current_city,
        state: row.current_state,
        country: row.current_country ?? "Brasil",
        count: 0,
        people: [],
      };
      current.count += 1;
      current.people.push(row);
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }, []);
}

export async function getPeopleByPublicLocation(key: string): Promise<PublicLocationRow[]> {
  const stats = await getPublicLocationStats();
  return stats.find(item => item.key === key)?.people ?? [];
}

// ─── ADMIN USERS ─────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<DbAdminUser[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("admin_users").select("*").order("created_at");
    if (error) throw error;
    return (data as DbAdminUser[]) ?? [];
  }, []);
}

export async function addAdminUser(userId: string, role: AdminRole, displayName: string, email: string, adminId: string) {
  const { error } = await supabase.from("admin_users").insert({ user_id: userId, role, display_name: displayName, email });
  if (error) throw error;
  await writeAudit("add_admin", "admin_users", userId, { role, added_by: adminId });
}

export async function updateAdminRole(id: string, role: AdminRole, adminId: string) {
  const { error } = await supabase.from("admin_users").update({ role }).eq("id", id);
  if (error) throw error;
  await writeAudit("update_admin_role", "admin_users", id, { role, updated_by: adminId });
}

export async function removeAdminUser(id: string, adminId: string) {
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;
  await writeAudit("remove_admin", "admin_users", id, { removed_by: adminId });
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

export async function getAuditLogs(limit = 100, offset = 0): Promise<DbAuditLog[]> {
  return withFallback(async () => {
    const { data, error } = await supabase.from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data as DbAuditLog[]) ?? [];
  }, []);
}

// ─── PHOTO REMOVAL REQUESTS ───────────────────────────────────────────────────

export async function createPhotoRemovalRequest(params: {
  photoId: string; userId: string; requesterName: string;
  requesterEmail: string; reason: string;
}) {
  const { data, error } = await supabase.from("photo_removal_requests").insert({
    photo_id:          params.photoId,
    requester_user_id: params.userId,
    requester_name:    params.requesterName,
    requester_email:   params.requesterEmail,
    reason:            params.reason,
    status:            "pending",
  }).select().single();
  if (error) throw error;
  await writeAudit("create_photo_removal_request", "photo_removal_requests", (data as DbPhotoRemovalRequest).id, {
    photo_id: params.photoId,
  });
  return data as DbPhotoRemovalRequest;
}

export async function getPhotoRemovalRequests(status?: string): Promise<(DbPhotoRemovalRequest & { photos?: Partial<DbPhoto> })[]> {
  return withFallback(async () => {
    let q = supabase.from("photo_removal_requests")
      .select("*, photos(image_url, caption, status)")
      .order("created_at", { ascending: false });
    if (status) q = (q as any).eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function reviewPhotoRemovalRequest(id: string, action: "approved" | "rejected" | "hidden_preventively", adminId: string, notes?: string) {
  const { data: req, error: reqErr } = await supabase.from("photo_removal_requests")
    .update({ status: action, reviewed_by_admin_id: adminId, reviewed_at: new Date().toISOString(), admin_notes: notes ?? null })
    .eq("id", id).select("photo_id").single();
  if (reqErr) throw reqErr;
  if (action === "approved") {
    await supabase.from("photos").update({ status: "removed" }).eq("id", (req as any).photo_id);
  } else if (action === "hidden_preventively") {
    await supabase.from("photos").update({ status: "removed" }).eq("id", (req as any).photo_id);
  }
  await writeAudit(`removal_request_${action}`, "photo_removal_requests", id, { admin_id: adminId, notes });
}

// ─── PROFILE CLAIM DISPUTES ───────────────────────────────────────────────────

export async function createProfileClaimDispute(params: {
  personId: string; userId: string; currentClaimantUserId: string | null;
  requesterName: string; requesterEmail: string; requesterPhone: string;
  reason: string; evidenceText: string;
}) {
  const { data, error } = await supabase.from("profile_claim_disputes").insert({
    person_id:                params.personId,
    current_claimant_user_id: params.currentClaimantUserId,
    requester_user_id:        params.userId,
    requester_name:           params.requesterName,
    requester_email:          params.requesterEmail,
    requester_phone:          params.requesterPhone,
    reason:                   params.reason,
    evidence_text:            params.evidenceText,
    status:                   "pending",
  }).select().single();
  if (error) throw error;
  await writeAudit("create_profile_claim_dispute", "profile_claim_disputes", (data as DbProfileClaimDispute).id, {
    person_id: params.personId,
  });
  return data as DbProfileClaimDispute;
}

export async function getProfileClaimDisputes(status?: string): Promise<(DbProfileClaimDispute & { people?: Partial<DbPerson> })[]> {
  return withFallback(async () => {
    let q = supabase.from("profile_claim_disputes")
      .select("*, people(full_name, nickname_at_school, class_group)")
      .order("created_at", { ascending: false });
    if (status) q = (q as any).eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as any;
  }, []);
}

export async function reviewProfileClaimDispute(id: string, action: "approved" | "rejected", adminId: string, notes?: string) {
  const { data: dispute, error: dErr } = await supabase.from("profile_claim_disputes")
    .update({ status: action, reviewed_by_admin_id: adminId, reviewed_at: new Date().toISOString(), admin_notes: notes ?? null })
    .eq("id", id).select("person_id, requester_user_id, current_claimant_user_id").single();
  if (dErr) throw dErr;
  if (action === "approved") {
    const d = dispute as any;
    // Transfer ownership
    await supabase.from("people").update({
      claimed_by_user_id: d.requester_user_id,
      claimed_at:         new Date().toISOString(),
    }).eq("id", d.person_id);
    // Update profile user_id if exists
    await supabase.from("profiles").update({ user_id: d.requester_user_id }).eq("person_id", d.person_id);
  }
  await writeAudit(`dispute_${action}`, "profile_claim_disputes", id, { admin_id: adminId, notes });
}

// ─── PROFILE CLAIMS (completar persistência) ──────────────────────────────────

export async function createFullProfileClaim(params: {
  personId: string; userId: string | null; name: string; email: string; phone: string;
  answers: { key: string; text: string; score: number }[];
}): Promise<{ claim: DbProfileClaim; score: number }> {
  // Cria a solicitação
  const { data: claim, error } = await supabase.from("profile_claims").insert({
    person_id:          params.personId,
    requester_user_id:  params.userId,
    requester_name:     params.name,
    requester_email:    params.email,
    requester_phone:    params.phone,
    status:             "pending",
  }).select().single();
  if (error) throw error;

  // Salva as respostas
  const score = params.answers.reduce((s, a) => s + a.score, 0);
  await supabase.from("profile_claim_answers").insert(
    params.answers.map(a => ({
      claim_id:     (claim as DbProfileClaim).id,
      question_key: a.key,
      answer_text:  a.text,
      score_value:  a.score,
    }))
  );

  // Atualiza score
  await supabase.from("profile_claims").update({ verification_score: score }).eq("id", (claim as DbProfileClaim).id);
  await writeAudit("create_profile_claim", "profile_claims", (claim as DbProfileClaim).id, {
    person_id: params.personId,
    answers_count: params.answers.length,
    score,
  });

  return { claim: claim as DbProfileClaim, score };
}
