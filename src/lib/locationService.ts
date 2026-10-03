import { supabase } from "./supabase";
import { withFallback } from "./serviceFallback";
import type { LocationStat, PublicLocationRow } from "./people.types";

function compactLocationText(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function foldLocationKey(value?: string | null) {
  return compactLocationText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function titleCaseLocation(value: string) {
  const compact = compactLocationText(value);
  if (!compact) return compact;

  const isUniformCase = compact === compact.toLocaleUpperCase("pt-BR")
    || compact === compact.toLocaleLowerCase("pt-BR");
  if (!isUniformCase) return compact;

  const connectors = new Set(["da", "das", "de", "do", "dos", "e"]);
  return compact
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((part, index) => {
      if (index > 0 && connectors.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1);
    })
    .join(" ");
}

function normalizeCountry(value?: string | null) {
  const compact = compactLocationText(value) || "Brasil";
  const folded = foldLocationKey(compact);
  if (folded === "brasil" || folded === "brazil") return "Brasil";
  return titleCaseLocation(compact);
}

function normalizeState(value?: string | null) {
  const compact = compactLocationText(value);
  if (!compact) return null;
  return /^[a-z]{2}$/i.test(compact) ? compact.toLocaleUpperCase("pt-BR") : titleCaseLocation(compact);
}

function normalizeCityAndState(cityValue: string, stateValue?: string | null) {
  let city = compactLocationText(cityValue);
  let state = normalizeState(stateValue);

  const suffix = city.match(/^(.*?)(?:\s*[\/,-]\s*|\s+)([A-Za-z]{2})$/u);
  if (suffix) {
    const suffixState = suffix[2].toLocaleUpperCase("pt-BR");
    if (!state || state.toLocaleUpperCase("pt-BR") === suffixState) {
      city = compactLocationText(suffix[1]);
      state = state ?? suffixState;
    }
  }

  return {
    city: titleCaseLocation(city),
    state,
  };
}

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
    const normalizedRows = rows.map(row => {
      const country = normalizeCountry(row.current_country);
      const { city, state } = normalizeCityAndState(row.current_city, row.current_state);
      return {
        row,
        city,
        state,
        country,
        cityKey: foldLocationKey(city),
        stateKey: foldLocationKey(state),
        countryKey: foldLocationKey(country),
      };
    });

    const statesByCity = new Map<string, Set<string>>();
    for (const item of normalizedRows) {
      if (!item.state) continue;
      const cityCountryKey = [item.cityKey, item.countryKey].join("|");
      const states = statesByCity.get(cityCountryKey) ?? new Set<string>();
      states.add(item.state);
      statesByCity.set(cityCountryKey, states);
    }

    const map = new Map<string, LocationStat>();
    for (const item of normalizedRows) {
      let state = item.state;
      if (!state) {
        const inferred = statesByCity.get([item.cityKey, item.countryKey].join("|"));
        if (inferred?.size === 1) state = Array.from(inferred)[0];
      }

      const stateKey = foldLocationKey(state);
      const key = [item.cityKey, stateKey, item.countryKey].join("|");
      const normalizedRow: PublicLocationRow = {
        ...item.row,
        current_city: item.city,
        current_state: state,
        current_country: item.country,
      };
      const current = map.get(key) ?? {
        key,
        city: item.city,
        state,
        country: item.country,
        count: 0,
        people: [],
      };
      current.count += 1;
      current.people.push(normalizedRow);
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "pt-BR"));
  }, []);
}

export async function getPeopleByPublicLocation(key: string): Promise<PublicLocationRow[]> {
  const stats = await getPublicLocationStats();
  return stats.find(item => item.key === key)?.people ?? [];
}
