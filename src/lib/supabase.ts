import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Credenciais do projeto Supabase (geradas pelo Figma Make)
// utils/ fica fora de src/, por isso o caminho relativo em vez do alias @/
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const supabaseUrl  = `https://${projectId}.supabase.co`;
const supabaseKey  = publicAnonKey;

// ─── CLIENT SINGLETON ─────────────────────────────────────────────────────────

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
  }
);

// ─── DEV_MODE ─────────────────────────────────────────────────────────────────
// DEV_MODE = true quando as migrations ainda não foram aplicadas ou o banco
// não está acessível. O app usa mock data como fallback automático.
// Para forçar modo de produção: set DEV_MODE = false após aplicar as migrations.

export const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true" || false;

// Helper: testa se o banco está disponível (migrations aplicadas)
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
