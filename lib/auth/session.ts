import { createClient } from "../supabase/server";

export async function requestSecurityWorker() {
  // Our generated API-clients seem unable to properly process the usage of the
  // "Headers" Web API class (see mergeRequestParams), so we use a plain object instead.
  const headers: { Authorization?: string } = {}
  try {
    const supbasebase = await createClient();
    const token = await supbasebase.auth.getSession()
    const accessToken = token?.data?.session?.access_token
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  } catch (e) {
    // If Supabase is not configured or fails, continue without auth header
  }

  return { headers }
}
