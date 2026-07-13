import { EVENT_PAGE_CONTENT_DEFAULTS, HOME_PAGE_CONTENT_DEFAULTS } from "./services";

function neutralizeObjectStrings<T extends Record<string, unknown>>(target: T, keep: Set<string>) {
  for (const key of Object.keys(target)) {
    if (keep.has(key)) continue;
    if (typeof target[key] === "string") target[key as keyof T] = "" as T[keyof T];
  }
}

export function installNeutralCmsDefaults() {
  neutralizeObjectStrings(HOME_PAGE_CONTENT_DEFAULTS as unknown as Record<string, unknown>, new Set(["event_id"]));
  Object.assign(HOME_PAGE_CONTENT_DEFAULTS, {
    header_logo_url: null,
    favicon_url: null,
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
  });
}
