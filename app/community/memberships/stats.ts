import { cache } from "react"
import { getMembershipStats } from "@/lib/service"
import type { MembershipStatsDto } from "@/lib/service/HsService"
import { firstParam, pageQuery } from "@/lib/search-params"
import { changeIn } from "@/lib/stats"

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
export const membershipStats = cache(
  async (
    q: string | undefined,
    planId: string | undefined,
    companyId: string | undefined,
    forCompanyId: string | undefined
  ): Promise<MembershipStatsDto | null> => {
    try {
      return (await getMembershipStats({ q, planId, companyId, forCompanyId })) as MembershipStatsDto
    } catch (error) {
      console.warn("Failed to load membership stats", error)
      return null
    }
  }
)

/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function membershipTotals(stats: MembershipStatsDto | null) {
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  const weeks = stats?.byWeek ?? []
  const plans = stats?.byPlan ?? []

  return {
    weeks,
    changeIn: (key: "created" | "starting") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    total: stats?.total,
    topPlan: stats?.byPlan[0],
    plans,
  }
}

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
