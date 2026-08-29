import { getMemberStats } from "@/lib/service"
import type { MemberKindHint, MemberStatsDto } from "@/lib/service/HsService"
import { asEnum, firstParam, pageQuery } from "@/lib/search-params"
import { cachedStats } from "@/lib/cached-stats"
import { MEMBER_KIND_HINT_VALUES } from "./member-status"

/**
 * The tabs and the summary cards both want these counts. Memoised per
 * request, so rendering them side by side asks the API once — but only
 * because the signature is positional primitives, not an options object.
 * React's cache() keys primitive arguments by value (a Map, SameValueZero)
 * and object/function arguments by reference (a WeakMap). Two call sites
 * that each build their own `{ q, kindHint, ... }` literal would produce
 * two distinct object references and therefore two cache misses, even with
 * identical contents — so this stays positional on purpose. Resist folding
 * it back into an options object; it would silently double the request.
 */
export const memberStats = cachedStats(
  "stats:members",
  (
    params,
    q: string | undefined,
    kindHint: MemberKindHint | undefined,
    companyId: string | undefined
  ) => getMemberStats({ q, kindHint, companyId }, params) as Promise<MemberStatsDto>
)

/**
 * Shared by the cards and the table so the two derive identical arguments:
 * `memberStats` is a cache() keyed by positional primitives, so both call
 * sites must land on the same values for `q`/`kindHint` to hit one cache
 * entry instead of firing the request twice.
 */
export function memberStatsArgs(params: Record<string, string | string[] | undefined>) {
  const { q } = pageQuery(params)
  const kindHint = asEnum<MemberKindHint>(firstParam(params.kindHint), MEMBER_KIND_HINT_VALUES)
  return { q, kindHint }
}

export { memberTotals } from "./totals"
