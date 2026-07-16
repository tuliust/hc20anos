// ================================================================
// Tipos TypeScript gerados do schema do Supabase
// Turma 2006 — Colégio Henrique Castriciano
// ================================================================

export type EventStatus   = "draft" | "published" | "cancelled" | "completed";
export type SalesStatus   = "open" | "paused" | "closed";
export type ProfileStatus = "unclaimed" | "claimed" | "confirmed";
export type RelationshipStatus = "single" | "dating" | "married";
export type Gender = "male" | "female";
export type TicketStatus  = "draft" | "open" | "paused" | "sold_out" | "closed";
export type PaymentStatus = "pending" | "in_process" | "approved" | "rejected" | "cancelled" | "refunded" | "expired" | "charged_back";
export type PhotoStatus   = "pending" | "approved" | "rejected" | "removed";
export type TagStatus     = "pending" | "approved" | "rejected" | "removed";
export type ClaimStatus   = "pending" | "approved" | "rejected" | "disputed" | "expired";
export type AdminRole            = "superadmin" | "admin" | "moderator" | "checkin_staff" | "viewer";
export type RemovalRequestStatus = "pending" | "approved" | "rejected" | "hidden_preventively";
export type DisputeStatus        = "pending" | "approved" | "rejected" | "cancelled";
export type ModerationStatus     = "pending" | "approved" | "rejected" | "hidden";
export type PollStatus           = "draft" | "open" | "closed" | "archived";

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
  display_name?:        string | null;
  gender?:              Gender | null;
  class_year:           number;
  class_group:          string | null;
  birth_year?:          number | null;
  verification_status?: string | null;
  contact_email?:       string | null;
  contact_whatsapp?:    string | null;
  nickname_at_school:   string | null;
  profile_status:       ProfileStatus;
  claimed_by_user_id:   uuid | null;
  claimed_at:           string | null;
  is_visible:           boolean;
  private_notes:        string | null;
  avatar_url?:          string | null;
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
  contact_email:        string | null;
  contact_whatsapp:     string | null;
  relationship_status:  RelationshipStatus | null;
  has_children:         boolean;
  children_count:       number | null;
  intends_to_attend?:   boolean | null;
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

export interface TicketWithDetails extends DbTicket {
  orders?: Partial<DbOrder> | null;
  ticket_types?: Partial<DbTicketType> | null;
  people?: Partial<DbPerson> | null;
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
  is_featured:          boolean;
  featured_by_admin_id: uuid | null;
  featured_at:          string | null;
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

export interface DbPhotoLike {
  id:         uuid;
  photo_id:   uuid;
  user_id:    uuid;
  created_at: string;
}

export interface DbPhotoComment {
  id:                   uuid;
  photo_id:             uuid;
  user_id:              uuid | null;
  author_name:          string | null;
  comment_text:         string;
  status:               ModerationStatus;
  approved_by_admin_id: uuid | null;
  approved_at:          string | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbMemory {
  id:                   uuid;
  event_id:             uuid;
  user_id:              uuid | null;
  person_id:            uuid | null;
  author_name:          string | null;
  memory_text:          string;
  is_anonymous:         boolean;
  status:               ModerationStatus;
  is_featured:          boolean;
  approved_by_admin_id: uuid | null;
  approved_at:          string | null;
  created_at:           string;
  updated_at:           string;
}

export interface PhotoStats {
  photo_id:       uuid;
  likes_count:    number;
  comments_count: number;
  is_featured?:   boolean;
}

export interface DbPoll {
  id:                   uuid;
  event_id:             uuid;
  question:             string;
  description:          string | null;
  status:               PollStatus;
  allow_multiple_votes: boolean;
  created_by_admin_id:  uuid | null;
  created_at:           string;
  updated_at:           string;
}

export interface DbPollOption {
  id:          uuid;
  poll_id:     uuid;
  option_text: string;
  sort_order:  number;
  created_at:  string;
}

export interface DbPollVote {
  id:         uuid;
  poll_id:    uuid;
  option_id:  uuid;
  user_id:    uuid;
  created_at: string;
}

export interface PollResultRow {
  poll_id:     uuid;
  option_id:   uuid;
  option_text: string;
  sort_order:  number;
  votes_count: number;
}

export interface PublicLocationRow {
  profile_id:       uuid;
  person_id:        uuid;
  display_name:     string | null;
  full_name:        string;
  avatar_url:       string | null;
  current_city:     string;
  current_state:    string | null;
  current_country:  string | null;
  profession:       string | null;
  show_profession:  boolean | null;
}

export interface PublicProfileCardRow {
  profile_id:          uuid;
  person_id:           uuid;
  display_name:        string | null;
  full_name:           string;
  avatar_url:          string | null;
  current_city:        string | null;
  current_state:       string | null;
  current_country:     string | null;
  profession:          string | null;
  instagram_url:       string | null;
  linkedin_url:        string | null;
  contact_whatsapp:    string | null;
  relationship_status: RelationshipStatus | null;
  has_children:        boolean;
  children_count:      number | null;
  intends_to_attend?:   boolean | null;
}

export interface AlumniDirectoryStatusRow {
  event_id:                    uuid;
  person_id:                   uuid;
  full_name:                   string;
  class_group:                 string | null;
  profile_status:              ProfileStatus;
  has_approved_ticket:         boolean;
  has_completed_registration:  boolean;
  intends_to_attend:           boolean;
  display_name:                string | null;
  avatar_url:                  string | null;
  current_city:                string | null;
  current_state:               string | null;
  current_country:             string | null;
  profession:                  string | null;
}


export interface CuriosityCountItem {
  label: string;
  count: number;
}

export interface SchoolQuestionnaireAnswerRow {
  id:                    uuid;
  event_id:              uuid;
  profile_id:            uuid;
  person_id:             uuid;
  question_id:           string;
  selected_options_json: string[];
  created_at:            string;
  updated_at:            string;
}

export interface SchoolQuestionnaireOptionStatRow {
  event_id:      uuid;
  question_id:   string;
  option_label:  string;
  answer_count:  number;
}

export interface CuriosityProfileStatsRow {
  event_id:                    uuid;
  total_people:                number;
  total_registered:            number;
  total_preconfirmed:          number;
  total_confirmed:             number;
  total_with_relationship:     number;
  total_with_children:         number;
  total_children_declared:     number;
  relationship_status_counts:  CuriosityCountItem[];
  children_status_counts:      CuriosityCountItem[];
  children_count_distribution: CuriosityCountItem[];
  profession_area_counts:      CuriosityCountItem[];
}

export interface LocationStat {
  key:      string;
  city:     string;
  state:    string | null;
  country:  string | null;
  count:    number;
  people:   PublicLocationRow[];
}

export interface ArchiveHighlightLink {
  label: string;
  url: string;
  description?: string | null;
}


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

export interface DbEventPageContent {
  event_id:             uuid;
  hero_eyebrow:         string | null;
  title:                string;
  subtitle:             string | null;
  description:          string | null;
  hero_image_url:       string | null;
  gallery_json:         EventPageGalleryItem[];
  map_embed_url:        string | null;
  map_link_url:         string | null;
  venue_notes:          string | null;
  attractions_json:     EventPageInfoItem[];
  schedule_json:        EventPageScheduleItem[];
  food_bar_text:        string | null;
  bathrooms_text:       string | null;
  security_text:        string | null;
  extra_info_json:      EventPageInfoItem[];
  updated_at:           string;
  updated_by_admin_id:  uuid | null;
}

export interface DbHomePageContent {
  event_id: uuid;
  header_logo_url: string | null;
  favicon_url: string | null;
  header_logo_alt: string;
  header_fallback_badge_main: string;
  header_fallback_badge_year: string;
  header_fallback_title: string;
  header_fallback_subtitle: string;
  header_cta_label: string;
  header_cta_visible: boolean;
  header_auth_visible: boolean;
  hero_eyebrow: string;
  hero_title: string;
  hero_tagline: string;
  hero_subtitle: string;
  hero_event_line: string;
  primary_cta_label: string;
  primary_cta_page: string;
  secondary_cta_label: string;
  secondary_cta_page: string;
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
  faq_search_placeholder: string | null;
  faq_empty_label: string | null;
  faq_view_all_label: string | null;
  faq_initial_mode: "featured" | "all" | null;
  nav_home_label: string;
  nav_event_label: string;
  nav_ex_alumni_label: string;
  nav_who_going_label: string;
  nav_the_class_label: string;
  nav_photos_label: string;
  nav_memories_label: string;
  nav_polls_label: string;
  nav_where_now_label: string;
  nav_archive_label: string;
  nav_home_visible: boolean;
  nav_event_visible: boolean;
  nav_ex_alumni_visible: boolean;
  nav_who_going_visible: boolean;
  nav_the_class_visible: boolean;
  nav_photos_visible: boolean;
  nav_memories_visible: boolean;
  nav_polls_visible: boolean;
  nav_where_now_visible: boolean;
  nav_archive_visible: boolean;
  home_sections_json: string;
  countdown_days_label: string;
  countdown_hours_label: string;
  countdown_minutes_label: string;
  countdown_seconds_label: string;
  info_date_label: string;
  info_time_label: string;
  info_location_label: string;
  info_doors_subtitle_template: string;
  info_dinner_subtitle_template: string;
  info_time_fallback_label: string;
  event_info_view_more_label: string;
  tickets_preview_limit: string;
  tickets_view_all_label: string;
  tickets_active_lot_label: string;
  tickets_buy_label: string;
  tickets_sold_out_label: string;
  tickets_empty_title: string;
  tickets_empty_subtitle: string;
  tickets_empty_cta_label: string;
  tickets_remaining_label_template: string;
  confirmed_preview_limit: string;
  confirmed_view_all_label: string;
  confirmed_privacy_note: string;
  photos_preview_limit: string;
  photos_view_all_label: string;
  photos_empty_title: string;
  photos_empty_subtitle: string;
  photos_empty_cta_label: string;
  timeline_items_json: string;
  home_nostalgia_timeline_json: string;
  faq_items_json: string;
  footer_links_json: string;
  footer_eyebrow: string;
  footer_title: string;
  footer_body: string;
  footer_nav_title: string;
  footer_contact_title: string;
  footer_email: string;
  footer_phone: string;
  footer_location: string;
  footer_copyright: string;
  footer_terms_label: string;
  footer_privacy_label: string;
  footer_admin_label: string;
  home_about_overview_json: string;
  home_alumni_overview_json: string;
  home_profile_stats_json: string;
  home_map_stats_json: string;
  home_poll_id: uuid | null;
  home_poll_fallback_json: string;
  updated_at: string;
  updated_by_admin_id: uuid | null;
}

export interface DbEventArchiveSettings {
  event_id:             uuid;
  archive_enabled:      boolean;
  page_eyebrow:         string;
  page_title:           string;
  message_label:        string;
  closed_title:         string;
  closed_text:          string;
  post_event_text:      string | null;
  official_video_url:   string | null;
  official_video_title: string | null;
  official_photo_ids:   uuid[];
  highlight_photo_ids:  uuid[];
  highlights_links:     ArchiveHighlightLink[];
  created_at:           string;
  updated_at:           string;
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

export interface DbFaqCategory {
  id: string;
  event_id: string;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  deleted_at: string | null;
  deleted_by_admin_id: string | null;
}

export interface DbFaqItem {
  id: string;
  event_id: string;
  category_id: string;
  slug: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  deleted_at: string | null;
  deleted_by_admin_id: string | null;
  category?: DbFaqCategory | null;
}

// ─── INSERT TYPES ──────────────────────────────────────────────────────────────

export type InsertOrder = Omit<DbOrder, "id" | "created_at" | "updated_at">;
export type InsertTicket = Omit<DbTicket, "id" | "qr_code" | "qr_token_hash" | "checked_in" | "created_at" | "updated_at">;
export type InsertPhoto = Omit<DbPhoto, "id" | "created_at" | "updated_at">;
export type InsertPhotoTag = Omit<DbPhotoTag, "id" | "created_at" | "updated_at">;
export type InsertPhotoLike = Omit<DbPhotoLike, "id" | "created_at">;
export type InsertPhotoComment = Omit<DbPhotoComment, "id" | "created_at" | "updated_at">;
export type InsertMemory = Omit<DbMemory, "id" | "created_at" | "updated_at">;
export type InsertPoll = Omit<DbPoll, "id" | "created_at" | "updated_at">;
export type InsertPollOption = Omit<DbPollOption, "id" | "created_at">;
export type InsertPollVote = Omit<DbPollVote, "id" | "created_at">;
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
      public_profile_cards:   { Row: PublicProfileCardRow; Insert: never;                         Update: never                         };
      public_alumni_directory_status: { Row: AlumniDirectoryStatusRow; Insert: never;              Update: never                         };
      profile_school_questionnaire_answers: { Row: SchoolQuestionnaireAnswerRow; Insert: Partial<SchoolQuestionnaireAnswerRow>; Update: Partial<SchoolQuestionnaireAnswerRow> };
      public_school_questionnaire_option_stats: { Row: SchoolQuestionnaireOptionStatRow; Insert: never; Update: never };
      public_curiosity_profile_stats: { Row: CuriosityProfileStatsRow; Insert: never; Update: never };
      ticket_types:           { Row: DbTicketType;         Insert: Partial<DbTicketType>;         Update: Partial<DbTicketType>         };
      orders:                 { Row: DbOrder;              Insert: InsertOrder;                   Update: Partial<DbOrder>              };
      tickets:                { Row: DbTicket;             Insert: InsertTicket;                  Update: Partial<DbTicket>             };
      payment_events:         { Row: any;                  Insert: any;                           Update: any                           };
      photos:                 { Row: DbPhoto;              Insert: InsertPhoto;                   Update: Partial<DbPhoto>              };
      photo_tags:             { Row: DbPhotoTag;           Insert: InsertPhotoTag;                Update: Partial<DbPhotoTag>           };
      photo_likes:            { Row: DbPhotoLike;          Insert: InsertPhotoLike;               Update: never                         };
      photo_comments:         { Row: DbPhotoComment;       Insert: InsertPhotoComment;            Update: Partial<DbPhotoComment>       };
      memories:               { Row: DbMemory;             Insert: InsertMemory;                  Update: Partial<DbMemory>             };
      polls:                  { Row: DbPoll;               Insert: InsertPoll;                    Update: Partial<DbPoll>               };
      poll_options:           { Row: DbPollOption;         Insert: InsertPollOption;              Update: Partial<DbPollOption>         };
      poll_votes:             { Row: DbPollVote;           Insert: InsertPollVote;                Update: never                         };
      event_page_content:     { Row: DbEventPageContent;    Insert: Partial<DbEventPageContent>;    Update: Partial<DbEventPageContent>    };
      home_page_content:      { Row: DbHomePageContent;     Insert: Partial<DbHomePageContent>;     Update: Partial<DbHomePageContent>     };
      faq_categories:         { Row: DbFaqCategory;         Insert: Partial<DbFaqCategory>;         Update: Partial<DbFaqCategory>         };
      faq_items:              { Row: DbFaqItem;             Insert: Partial<DbFaqItem>;             Update: Partial<DbFaqItem>             };
            event_archive_settings: { Row: DbEventArchiveSettings; Insert: Partial<DbEventArchiveSettings>; Update: Partial<DbEventArchiveSettings> };
      photo_removal_requests: { Row: DbPhotoRemovalRequest; Insert: Partial<DbPhotoRemovalRequest>; Update: Partial<DbPhotoRemovalRequest> };
      profile_claim_disputes: { Row: DbProfileClaimDispute; Insert: Partial<DbProfileClaimDispute>; Update: Partial<DbProfileClaimDispute> };
      profile_claims:         { Row: DbProfileClaim;       Insert: InsertProfileClaim;            Update: Partial<DbProfileClaim>       };
      profile_claim_answers:  { Row: DbProfileClaimAnswer; Insert: InsertProfileClaimAnswer;      Update: Partial<DbProfileClaimAnswer> };
      admin_users:            { Row: DbAdminUser;          Insert: Partial<DbAdminUser>;          Update: Partial<DbAdminUser>          };
      audit_logs:             { Row: DbAuditLog;           Insert: Partial<DbAuditLog>;           Update: never                         };
    };
    Views: {
      poll_results:             { Row: PollResultRow };
      public_profile_locations: { Row: PublicLocationRow };
    };
    Functions: {
      is_admin:           { Args: Record<string, never>; Returns: boolean };
      fn_increment_sold:  { Args: { p_ticket_type_id: string; delta?: number }; Returns: void };
      get_event_reports:  { Args: { p_event_id: string }; Returns: Record<string, number> };
      reorder_faq_items:  { Args: { p_event_id: string; p_category_id: string; p_items: Array<{ id: string; sort_order: number }>; p_admin_id?: string | null }; Returns: void };
      reorder_faq_categories: { Args: { p_event_id: string; p_categories: Array<{ id: string; sort_order: number }>; p_admin_id?: string | null }; Returns: void };
      has_structured_faq_items: { Args: { p_event_id: string }; Returns: boolean };
      move_faq_category_items: { Args: { p_source_category_id: string; p_target_category_id: string; p_admin_id?: string | null }; Returns: number };
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
