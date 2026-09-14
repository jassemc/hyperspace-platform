import { createClient } from "../supabase/server"
import { SessionExpiredError } from "./api-auth"

/**
 * Whether Supabase is configured at all. Absent env is a DEPLOYMENT
 * fault, not a user one, and it is the only case in which continuing
 * unauthenticated is the right answer (local work against an open API).
 */
const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
)

/**
 * The caller's access token.
 *
 * These two meanings used to collapse into one `return null` (#75 /
 * S-11): "Supabase is not configured" and "the session read failed".
 * The second is a revoked refresh token, a banned user or a stale JWT —
 * a user who needs to sign in again — and answering it with null made
 * every request anonymous, which the API refuses, which rendered a full
 * shell with empty tables and dashed KPIs. The staff member's first
 * guess is "I lost my permissions".
 *
 * Now only the configuration case returns null; a runtime failure, or a
 * configured Supabase with no session, raises SessionExpiredError so the
 * shell can say so and send the user to the login page.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!supabaseConfigured) {
    return null
  }
  let token: string | null | undefined
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token
  } catch {
    throw new SessionExpiredError()
  }
  if (!token) {
    throw new SessionExpiredError()
  }
  return token
}
