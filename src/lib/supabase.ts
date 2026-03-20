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

  const supabaseUrl = (envUrl && envUrl !== '') ? envUrl : 'https://xdwplwqpnsglaitedehu.supabase.co';
  const supabaseAnonKey = (envKey && envKey !== '') ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3Bsd3FwbnNnbGFpdGVkZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjQ1OTEsImV4cCI6MjA4ODM0MDU5MX0.GupAMmWSDv39aeFwp0QfmYReClfGkz_DUsbAnGNADDY';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

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
