import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Whether Supabase is configured with real credentials */
export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;

/**
 * Supabase client singleton.
 * Safe to import even when env vars are placeholders — guarded by `isSupabaseConfigured`.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);
