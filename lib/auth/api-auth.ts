import { redirect } from "next/navigation"
/**
 * What the API's auth failures mean, as types the app can act on (#75 /
 * S-11).
 *
 * Before this, `getAccessToken()` returned null on ANY failure — the two
 * meanings collapsed into one — and nothing mapped 401 or 403 to a
 * user-facing state. A revoked refresh token, a banned user or a stale
 * JWT therefore produced a fully rendered shell with empty tables and
 * dashed KPI cards, indistinguishable from "there is no data". An empty
 * Bookings list at 09:00 on a Monday, with no message, leads to
 * duplicate work or a call to the owner.
 */

/** The session is gone or no longer accepted: sign in again. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired")
    this.name = "SessionExpiredError"
  }
}

/**
 * Authenticated with Supabase, but this back office does not know the
 * account: either no `users` row at all (401 user_profile_not_found) or
 * a row with no role (403 no_role_assigned). Only the owner can fix it,
 * and crucially it is NOT something signing in again can solve — which
 * is why it must not be routed to the login page.
 */
export class NoRoleError extends Error {
  constructor() {
    super("This account has no access to the back office")
    this.name = "NoRoleError"
  }
}

/** Signed in with a role, but this action needs a permission it lacks. */
export class ForbiddenError extends Error {
  constructor(detail?: string) {
    super(detail || "You do not have permission to do that")
    this.name = "ForbiddenError"
  }
}

export type AuthError = SessionExpiredError | NoRoleError | ForbiddenError

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof SessionExpiredError ||
    error instanceof NoRoleError ||
    error instanceof ForbiddenError
  )
}

/**
 * Escalate an auth failure out of a `catch` that would otherwise swallow
 * it.
 *
 * The table sections deliberately swallow load failures so one dead
 * endpoint cannot blank a whole page — but an auth failure is not a dead
 * endpoint. It is the reason EVERY endpoint on the page is about to
 * fail, and swallowing it is precisely what produced a full shell of
 * empty tables and dashed KPIs with nothing to explain them (#75).
 *
 * A lost session and a role-less account become destinations: `redirect`
 * throws NEXT_REDIRECT, and since this runs INSIDE the caller's catch
 * block, that throw escapes to Next rather than being swallowed again.
 * A plain ForbiddenError is re-thrown instead — the user is signed in
 * and has a role, they simply cannot do this one thing, so bouncing them
 * out of the app would lose the page they were on.
 *
 * Call it from a server component or server action; `redirect` needs a
 * request context.
 */
export function escalateAuthError(error: unknown): void {
  if (error instanceof SessionExpiredError) {
    redirect("/auth/login?reason=expired")
  }
  if (error instanceof NoRoleError) {
    redirect("/auth/no-role")
  }
  if (error instanceof ForbiddenError) {
    throw error
  }
}

/**
 * Problem types that mean "this account is not provisioned here", as
 * opposed to "your session lapsed".
 *
 * `user_profile_not_found` arrives as a 401 even though signing in again
 * cannot possibly help — the Supabase account is fine, the back office
 * simply has no user row for it. Treating it as an expired session sends
 * the user to the login page, which sees perfectly valid claims and
 * bounces them straight back: a loop that ends on a contentless page,
 * which is no better than the empty tables this ticket is about.
 */
const NOT_PROVISIONED = new Set(["user_profile_not_found", "no_role_assigned"])

/** The problem body the API returns, as far as this module cares. */
async function readProblem(
  response: Response
): Promise<{ type?: string; detail?: string }> {
  try {
    // A clone: the caller still needs the body.
    return (await response.clone().json()) as { type?: string; detail?: string }
  } catch {
    // A 401/403 with no JSON body is still a 401/403.
    return {}
  }
}

/**
 * Turn an API response into one of the errors above. Returns the
 * response untouched when it is not an auth failure.
 */
export async function assertApiAuthOk(response: Response): Promise<Response> {
  if (response.status === 401) {
    const { type } = await readProblem(response)
    throw type && NOT_PROVISIONED.has(type)
      ? new NoRoleError()
      : new SessionExpiredError()
  }
  if (response.status === 403) {
    const { type, detail } = await readProblem(response)
    throw type && NOT_PROVISIONED.has(type)
      ? new NoRoleError()
      : new ForbiddenError(detail)
  }
  return response
}
