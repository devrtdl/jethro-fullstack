import { supabase } from './supabase';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};

  return { Authorization: `Bearer ${session.access_token}` };
}
