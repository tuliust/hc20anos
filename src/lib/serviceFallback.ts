import { DEV_MODE } from "./supabase";

export async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (DEV_MODE) return fallback;
    throw error;
  }
}
