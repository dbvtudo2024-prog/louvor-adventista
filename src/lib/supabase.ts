import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  // Use process.env with safety checks, and fallback to import.meta.env
  let envUrl: string | undefined;
  let envKey: string | undefined;

  try {
    if (typeof process !== 'undefined' && process.env) {
      envUrl = (process.env as any).VITE_SUPABASE_URL;
      envKey = (process.env as any).VITE_SUPABASE_ANON_KEY;
    }
  } catch (e) {
    console.warn('Erro ao acessar process.env:', e);
  }

  // Fallback to import.meta.env if process.env is not available
  if (!envUrl) envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  if (!envKey) envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  // If the user hasn't configured custom environment variables, or if they are pointing to the old deleted project,
  // we return null to run in offline/local mock mode. This prevents "Failed to fetch" errors on load.
  if (!envUrl || !envKey || envUrl.includes('xdwplwqpnsglaitedehu')) {
    return null;
  }

  const supabaseUrl = envUrl;
  const supabaseAnonKey = envKey;

  const isStorageAvailable = (() => {
    try {
      const key = '__test__';
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  })();

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isStorageAvailable,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: isStorageAvailable ? window.localStorage : undefined
    }
  });
  return supabaseInstance;
}

// For backward compatibility in types if needed, but we'll use the getter
export const supabase = getSupabase();
