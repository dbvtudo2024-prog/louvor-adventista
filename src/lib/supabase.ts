import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const supabaseUrl = (envUrl && envUrl !== '') ? envUrl : 'https://xdwplwqpnsglaitedehu.supabase.co';
  const supabaseAnonKey = (envKey && envKey !== '') ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3Bsd3FwbnNnbGFpdGVkZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjQ1OTEsImV4cCI6MjA4ODM0MDU5MX0.GupAMmWSDv39aeFwp0QfmYReClfGkz_DUsbAnGNADDY';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  });
  return supabaseInstance;
}

// For backward compatibility in types if needed, but we'll use the getter
export const supabase = getSupabase();
