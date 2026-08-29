import { getMembershipStats } from "@/lib/service"
import type { MembershipStatsDto } from "@/lib/service/HsService"
import { firstParam, pageQuery } from "@/lib/search-params"
import { cachedStats } from "@/lib/cached-stats"

/**
 * The tabs and the summary cards both want these counts. Memoised per
 * request, so rendering them side by side asks the API once — but only
 * because the signature is positional primitives, not an options object.
 * React's cache() keys primitive arguments by value (a Map, SameValueZero)
 * and object/function arguments by reference (a WeakMap). Two call sites
 * that each build their own `{ q, planId, ... }` literal would produce
 * two distinct object references and therefore two cache misses, even with
 * identical contents — so this stays positional on purpose. Resist folding
 * it back into an options object; it would silently double the request.
 */
export const membershipStats = cachedStats(
  "stats:memberships",
  (
    params,
    q: string | undefined,
    planId: string | undefined,
    companyId: string | undefined,
    forCompanyId: string | undefined
  ) =>
    getMembershipStats(
      { q, planId, companyId, forCompanyId },
      params
    ) as Promise<MembershipStatsDto>
)

/**
 * Shared by the cards and the table so the two derive identical arguments:
 * `membershipStats` is a cache() keyed by positional primitives, so both
 * call sites must land on the same values for `q`/`planId` to hit one cache
 * entry instead of firing the request twice.
 */
export function membershipStatsArgs(params: Record<string, string | string[] | undefined>) {
  const { q } = pageQuery(params)
  const planId = firstParam(params.planId) || undefined
  return { q, planId }
}

export { membershipTotals } from "./totals"
