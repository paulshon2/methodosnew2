import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function getSupabase() {
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export function getAuthenticatedSupabase(token: string) {
  if (!url || !anon) return null;
  return createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

let _service: SupabaseClient | null = null;
export function getServiceSupabase() {
  if (!url || !service) return null;
  if (!_service) _service = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  return _service;
}

export const supabaseConfigured = !!(url && anon);
export const supabaseServiceConfigured = !!(url && service);
