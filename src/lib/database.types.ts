// ================================================================
// Tipos TypeScript gerados do schema do Supabase
// Turma 2006 — Colégio Henrique Castriciano
// ================================================================

export type EventStatus   = "draft" | "published" | "cancelled" | "completed";
export type SalesStatus   = "open" | "paused" | "closed";
export type ProfileStatus = "unclaimed" | "claimed" | "confirmed";
export type TicketStatus  = "draft" | "open" | "paused" | "sold_out" | "closed";
export type PaymentStatus = "pending" | "in_process" | "approved" | "rejected" | "cancelled" | "refunded" | "expired" | "charged_back";
export type PhotoStatus   = "pending" | "approved" | "rejected" | "removed";
export type TagStatus     = "pending" | "approved" | "rejected" | "removed";
export type ClaimStatus   = "pending" | "approved" | "rejected" | "disputed" | "expired";
export type AdminRole            = "superadmin" | "admin" | "moderator" | "checkin_staff" | "viewer";
export type RemovalRequestStatus = "pending" | "approved" | "rejected" | "hidden_preventively";
export type DisputeStatus        = "pending" | "approved" | "rejected" | "cancelled";

// ─── ROWS (o que vem do banco) ─────────────────────────────────────────────────

export interface DbEvent {
  id:                uuid;
  title:             string;
  slug:              string;
  description:       string | null;
  event_date:        string;          // ISO date "2026-10-17"
  event_time:        string;          // "19:00:00"
  location_name:     string;
  location_address:  string | null;
  event_status:      EventStatus;
  sales_status:      SalesStatus;
  contact_email:     string | null;
  contact_whatsapp:  string | null;
  general_rules:     string | null;
  companion_policy:  string | null;
  refund_policy:     string | null;
  created_at:        string;
  updated_at:        string;
}

export interface DbPerson {
  id:                   uuid;
  full_name:            string;
  class_year:           number;
  class_group:          string | null;
  nickname_at_school:   string | null;
  profile_status:       ProfileStatus;
  claimed_by_user_id:   uuid | null;
  claimed_at:           string | null;
  is_visible:           boolean;
  private_notes:        string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbProfile {
  id:                   uuid;
  person_id:            uuid;
  user_id:              uuid;
  display_name:         string | null;
  current_photo_url:    string | null;
  current_city:         string | null;
  current_state:        string | null;
  current_country:      string | null;
  profession:           string | null;
  bio:                  string | null;
  memory_text:          string | null;
  instagram_url:        string | null;
  linkedin_url:         string | null;
  show_current_photo:   boolean;
  show_city:            boolean;
  show_profession:      boolean;
  show_social_links:    boolean;
  allow_photo_tags:     boolean;
  show_confirmed_status: boolean;
  created_at:           string;
  updated_at:           string;
}

export interface DbTicketType {
  id:                 uuid;
  event_id:           uuid;
  name:               string;
  description:        string | null;
  price_cents:        number;
  available_quantity: number;
  sold_quantity:      number;
  sales_start_at:     string | null;
  sales_end_at:       string | null;
  allows_guest:       boolean;
  status:             TicketStatus;
  created_at:         string;
  updated_at:         string;
}

export interface DbOrder {
  id:                             uuid;
  event_id:                       uuid;
  buyer_name:                     string;
  buyer_email:                    string;
  buyer_phone:                    string | null;
  person_id:                      uuid | null;
  ticket_type_id:                 uuid;
  quantity:                       number;
  total_amount_cents:             number;
  payment_provider:               string;
  payment_provider_order_id:      string | null;
  payment_provider_preference_id: string | null;
  payment_status:                 PaymentStatus;
  payment_method:                 string | null;
  paid_at:                        string | null;
  expires_at:                     string | null;
  created_at:                     string;
  updated_at:                     string;
}

export interface DbTicket {
  id:                       uuid;
  order_id:                 uuid;
  ticket_type_id:           uuid;
  person_id:                uuid | null;
  attendee_name:            string;
  attendee_email:           string;
  attendee_phone:           string | null;
  guest_name:               string | null;
  qr_code:                  string;
  qr_token_hash:            string;
  checked_in:               boolean;
  checked_in_at:            string | null;
  checked_in_by_admin_id:   uuid | null;
  created_at:               string;
  updated_at:               string;
}

export interface DbPhoto {
  id:                   uuid;
  event_id:             uuid | null;
  image_url:            string;
  thumbnail_url:        string | null;
  storage_path:         string | null;
  caption:              string | null;
  year_approx:          number | null;
  location_text:        string | null;
  uploaded_by_user_id:  uuid | null;
  uploaded_by_name:     string | null;
  authorization_given:  boolean;
  status:               PhotoStatus;
  approved_by_admin_id: uuid | null;
  approved_at:          string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbPhotoTag {
  id:                   uuid;
  photo_id:             uuid;
  person_id:            uuid;
  tagged_name_snapshot: string;
  status:               TagStatus;
  created_by_user_id:   uuid | null;
  approved_by_admin_id: uuid | null;
  approved_at:          string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbProfileClaim {
  id:                   uuid;
  person_id:            uuid;
  requester_user_id:    uuid | null;
  requester_name:       string;
  requester_email:      string;
  requester_phone:      string | null;
  verification_score:   number | null;
  status:               ClaimStatus;
  reviewed_by_admin_id: uuid | null;
  reviewed_at:          string | null;
  rejection_reason:     string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbProfileClaimAnswer {
  id:           uuid;
  claim_id:     uuid;
  question_key: string;
  answer_text:  string;
  score_value:  number;
  is_match:     boolean | null;
  created_at:   string;
}

export interface DbAdminUser {
  id:           uuid;
  user_id:      uuid;
  role:         AdminRole;
  display_name: string | null;
  email:        string | null;
  updated_at:   string;
  created_at:   string;
}

export interface DbPhotoRemovalRequest {
  id:                   uuid;
  photo_id:             uuid;
  requester_user_id:    uuid | null;
  requester_name:       string;
  requester_email:      string;
  reason:               string;
  status:               RemovalRequestStatus;
  reviewed_by_admin_id: uuid | null;
  reviewed_at:          string | null;
  admin_notes:          string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbProfileClaimDispute {
  id:                       uuid;
  person_id:                uuid;
  current_claimant_user_id: uuid | null;
  requester_user_id:        uuid | null;
  requester_name:           string;
  requester_email:          string;
  requester_phone:          string | null;
  reason:                   string;
  evidence_text:            string | null;
  status:                   DisputeStatus;
  reviewed_by_admin_id:     uuid | null;
  reviewed_at:              string | null;
  admin_notes:              string | null;
  created_at:               string;
  updated_at:               string;
}

export interface DbAuditLog {
  id:             uuid;
  user_id:        uuid | null;
  action:         string;
  entity_type:    string;
  entity_id:      uuid | null;
  metadata_json:  Record<string, unknown>;
  created_at:     string;
}

// ─── INSERT TYPES ──────────────────────────────────────────────────────────────

export type InsertOrder = Omit<DbOrder, "id" | "created_at" | "updated_at">;
export type InsertTicket = Omit<DbTicket, "id" | "qr_code" | "qr_token_hash" | "checked_in" | "created_at" | "updated_at">;
export type InsertPhoto = Omit<DbPhoto, "id" | "created_at" | "updated_at">;
export type InsertPhotoTag = Omit<DbPhotoTag, "id" | "created_at" | "updated_at">;
export type InsertProfileClaim = Omit<DbProfileClaim, "id" | "created_at" | "updated_at">;
export type InsertProfileClaimAnswer = Omit<DbProfileClaimAnswer, "id" | "created_at">;
export type UpsertProfile = Omit<DbProfile, "id" | "created_at" | "updated_at">;

// ─── DATABASE TYPE MAP (para createClient<Database>) ──────────────────────────

type uuid = string;

export interface Database {
  public: {
    Tables: {
      events:                 { Row: DbEvent;              Insert: Partial<DbEvent>;              Update: Partial<DbEvent>              };
      people:                 { Row: DbPerson;             Insert: Partial<DbPerson>;             Update: Partial<DbPerson>             };
      profiles:               { Row: DbProfile;            Insert: UpsertProfile;                 Update: Partial<DbProfile>            };
      ticket_types:           { Row: DbTicketType;         Insert: Partial<DbTicketType>;         Update: Partial<DbTicketType>         };
      orders:                 { Row: DbOrder;              Insert: InsertOrder;                   Update: Partial<DbOrder>              };
      tickets:                { Row: DbTicket;             Insert: InsertTicket;                  Update: Partial<DbTicket>             };
      payment_events:         { Row: any;                  Insert: any;                           Update: any                           };
      photos:                 { Row: DbPhoto;              Insert: InsertPhoto;                   Update: Partial<DbPhoto>              };
      photo_tags:             { Row: DbPhotoTag;           Insert: InsertPhotoTag;                Update: Partial<DbPhotoTag>           };
      photo_removal_requests: { Row: DbPhotoRemovalRequest; Insert: Partial<DbPhotoRemovalRequest>; Update: Partial<DbPhotoRemovalRequest> };
      profile_claim_disputes: { Row: DbProfileClaimDispute; Insert: Partial<DbProfileClaimDispute>; Update: Partial<DbProfileClaimDispute> };
      profile_claims:         { Row: DbProfileClaim;       Insert: InsertProfileClaim;            Update: Partial<DbProfileClaim>       };
      profile_claim_answers:  { Row: DbProfileClaimAnswer; Insert: InsertProfileClaimAnswer;      Update: Partial<DbProfileClaimAnswer> };
      admin_users:            { Row: DbAdminUser;          Insert: Partial<DbAdminUser>;          Update: Partial<DbAdminUser>          };
      audit_logs:             { Row: DbAuditLog;           Insert: Partial<DbAuditLog>;           Update: never                         };
    };
    Views:   Record<string, never>;
    Functions: {
      is_admin:           { Args: Record<string, never>; Returns: boolean };
      fn_increment_sold:  { Args: { p_ticket_type_id: string; delta?: number }; Returns: void };
      get_event_reports:  { Args: { p_event_id: string }; Returns: Record<string, number> };
    };
    Enums: {
      event_status:   EventStatus;
      sales_status:   SalesStatus;
      profile_status: ProfileStatus;
      ticket_status:  TicketStatus;
      payment_status: PaymentStatus;
      photo_status:   PhotoStatus;
      tag_status:     TagStatus;
      claim_status:   ClaimStatus;
      admin_role:     AdminRole;
    };
  };
}
