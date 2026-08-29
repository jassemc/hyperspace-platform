import { cache } from "react"
import { getMemberStats } from "@/lib/service"
import type { MemberKindHint, MemberStatsDto } from "@/lib/service/HsService"
import { asEnum, firstParam, pageQuery } from "@/lib/search-params"
import { changeIn } from "@/lib/stats"
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
export const memberStats = cache(
  async (
    q: string | undefined,
    kindHint: MemberKindHint | undefined,
    companyId: string | undefined
  ): Promise<MemberStatsDto | null> => {
    try {
      return (await getMemberStats({ q, kindHint, companyId })) as MemberStatsDto
    } catch (error) {
      console.warn("Failed to load member stats", error)
      return null
    }
  }
)

/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function memberTotals(stats: MemberStatsDto | null) {
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  const byKind = new Map<string, number>(
    (stats?.byKindHint ?? []).map((row) => [row.kindHint, row.count])
  )
  const weeks = stats?.byWeek ?? []

  return {
    weeks,
    changeIn: (key: "created") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    kindCount: (kind: string) => (stats ? (byKind.get(kind) ?? 0) : undefined),
    total: stats?.total,
    withCompany: stats?.withCompany,
  }
}

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
