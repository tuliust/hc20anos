// ================================================================
// Services — Turma 2006
// Todas as funções tentam o Supabase primeiro e caem no mock se
// o banco não estiver configurado (DEV_MODE) ou houver erro.
// ================================================================

import { DEV_MODE, supabase } from "./supabase";
import type {
  DbPerson, DbTicketType, DbPhoto, DbPhotoTag,
  DbProfileClaim, DbProfileClaimAnswer, DbTicket,
  DbOrder, DbEvent, InsertOrder, UpsertProfile,
  DbAdminUser, DbAuditLog, TicketStatus, AdminRole,
  DbPhotoRemovalRequest, DbProfileClaimDispute,
  DbPhotoLike, DbPhotoComment, DbMemory, PhotoStats, ModerationStatus,
} from "./database.types";

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

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, people(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
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
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("payment_status", status as any);
    const { data, error } = await q;
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

// Busca para check-in: por QR code, nome, e-mail ou telefone
export async function findTicketForCheckin(query: string, mode: "qr" | "name" | "email" | "phone") {
  return withFallback(async () => {
    let q = supabase
      .from("tickets")
      .select("*, orders(payment_status, buyer_name), ticket_types(name)")
      .limit(5);

    if (mode === "qr")    q = q.eq("qr_code", query.toUpperCase());
    else if (mode === "email") q = q.ilike("attendee_email", `%${query}%`);
    else if (mode === "phone") q = q.ilike("attendee_phone", `%${query}%`);
    else q = q.ilike("attendee_name", `%${query}%`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as (DbTicket & { orders: { payment_status: string; buyer_name: string } | null; ticket_types: { name: string } | null })[];
  }, []);
}

export async function checkInTicket(ticketId: string, adminUserId: string): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update({ checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by_admin_id: adminUserId })
    .eq("id", ticketId)
    .eq("checked_in", false);  // previne duplicação
  if (error) throw error;
  await writeAudit("checkin", "tickets", ticketId, { admin_id: adminUserId });
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
