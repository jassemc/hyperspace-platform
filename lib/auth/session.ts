import { createClient } from "../supabase/server";

export async function requestSecurityWorker() {
  // Our generated API-clients seem unable to properly process the usage of the
  // "Headers" Web API class (see mergeRequestParams), so we use a plain object instead.
  const headers: { Authorization?: string } = {}
  const supbasebase = await createClient();

  const token = await supbasebase.auth.getSession()

  if (token) {
    headers['Authorization'] = `Bearer ${token.data.session?.access_token}`
  }

  return { headers }
}
