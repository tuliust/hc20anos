import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  // Keep this explicit: the app should fail fast in production when the public env vars are missing.
  // Do not put service role keys or database passwords in Vite env vars.
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

let _dbReady: boolean | null = null;
export async function isDbReady(): Promise<boolean> {
  if (_dbReady !== null) return _dbReady;
  try {
    const { error } = await supabase.from("events").select("id").limit(1);
    _dbReady = !error;
  } catch {
    _dbReady = false;
  }
  return _dbReady;
}
