import { EVENT_PAGE_CONTENT_DEFAULTS, HOME_PAGE_CONTENT_DEFAULTS } from "./services";

function neutralizeObjectStrings<T extends Record<string, unknown>>(target: T, keep: Set<string>) {
  for (const key of Object.keys(target)) {
    if (keep.has(key)) continue;
    if (typeof target[key] === "string") target[key as keyof T] = "" as T[keyof T];
  }
}

const NEUTRAL_EXTENDED_HOME_CONTENT = {
  header_logo_alt: "",
  header_fallback_badge_main: "",
  header_fallback_badge_year: "",
  header_fallback_title: "",
  header_fallback_subtitle: "",
  header_cta_label: "",
  header_cta_visible: false,
  header_auth_visible: false,
  primary_cta_page: "home",
  secondary_cta_page: "home",
  nav_home_label: "",
  nav_event_label: "",
  nav_ex_alumni_label: "",
  nav_who_going_label: "",
  nav_the_class_label: "",
  nav_photos_label: "",
  nav_memories_label: "",
  nav_polls_label: "",
  nav_where_now_label: "",
  nav_archive_label: "",
  nav_home_visible: false,
  nav_event_visible: false,
  nav_ex_alumni_visible: false,
  nav_who_going_visible: false,
  nav_the_class_visible: false,
  nav_photos_visible: false,
  nav_memories_visible: false,
  nav_polls_visible: false,
  nav_where_now_visible: false,
  nav_archive_visible: false,
  home_sections_json: "[]",
  countdown_days_label: "",
  countdown_hours_label: "",
  countdown_minutes_label: "",
  countdown_seconds_label: "",
  info_date_label: "",
  info_time_label: "",
  info_location_label: "",
  info_doors_subtitle_template: "",
  info_dinner_subtitle_template: "",
  info_time_fallback_label: "",
  tickets_preview_limit: "0",
  tickets_view_all_label: "",
  tickets_active_lot_label: "",
  tickets_buy_label: "",
  tickets_sold_out_label: "",
  tickets_empty_title: "",
  tickets_empty_subtitle: "",
  tickets_empty_cta_label: "",
  tickets_remaining_label_template: "",
  confirmed_preview_limit: "0",
  confirmed_view_all_label: "",
  confirmed_privacy_note: "",
  photos_preview_limit: "0",
  photos_view_all_label: "",
  photos_empty_title: "",
  photos_empty_subtitle: "",
  photos_empty_cta_label: "",
  timeline_items_json: "[]",
  faq_items_json: "[]",
  footer_links_json: "[]",
  footer_eyebrow: "",
  footer_title: "",
  footer_body: "",
  footer_nav_title: "",
  footer_contact_title: "",
  footer_email: "",
  footer_phone: "",
  footer_location: "",
  footer_copyright: "",
  footer_terms_label: "",
  footer_privacy_label: "",
  footer_admin_label: "",
  home_poll_id: null,
  home_alumni_overview_json: "[]",
  home_nostalgia_timeline_json: "[]",
  home_profile_stats_json: "[]",
  home_map_stats_json: "[]",
  home_poll_fallback_json: "[]",
};

const NEUTRAL_EVENT_EXTRAS = {
  local_section_eyebrow: "",
  local_section_title: "",
  program_section_eyebrow: "",
  program_section_title: "",
  program_image_url: null,
  program_image_alt: "",
  structure_section_eyebrow: "",
  structure_section_title: "",
  structure_cards_json: [],
  show_gallery_preview: false,
};

export function installNeutralCmsDefaults() {
  neutralizeObjectStrings(HOME_PAGE_CONTENT_DEFAULTS as unknown as Record<string, unknown>, new Set(["event_id"]));
  Object.assign(HOME_PAGE_CONTENT_DEFAULTS, {
    header_logo_url: null,
    favicon_url: null,
    ...NEUTRAL_EXTENDED_HOME_CONTENT,
  });

  neutralizeObjectStrings(EVENT_PAGE_CONTENT_DEFAULTS as unknown as Record<string, unknown>, new Set(["event_id"]));
  Object.assign(EVENT_PAGE_CONTENT_DEFAULTS, {
    hero_image_url: null,
    gallery_json: "[]",
    attractions_json: "[]",
    schedule_json: "[]",
    extra_info_json: "[]",
    map_embed_url: "",
    map_link_url: "",
    ...NEUTRAL_EVENT_EXTRAS,
  });
}
