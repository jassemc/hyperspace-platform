import { createClient } from "../supabase/server";

export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  } catch {
    return null // Supabase not configured: continue unauthenticated
  }
}
