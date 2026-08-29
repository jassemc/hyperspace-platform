import { getCompanyStats } from "@/lib/service"
import type { CompanyStatsDto } from "@/lib/service/HsService"
import { pageQuery } from "@/lib/search-params"
import { cachedStats } from "@/lib/cached-stats"

/**
 * The cards and the table both want these counts. Memoised per request, so
 * rendering them side by side asks the API once — but only because the
 * signature is positional primitives, not an options object. React's
 * cache() keys primitive arguments by value (a Map, SameValueZero) and
 * object/function arguments by reference (a WeakMap). Two call sites that
 * each build their own `{ q }` literal would produce two distinct object
 * references and therefore two cache misses, even with identical contents —
 * so this stays positional on purpose. Resist folding it back into an
 * options object; it would silently double the request.
 */
export const companyStats = cachedStats(
  "stats:companies",
  (params, q: string | undefined) => getCompanyStats({ q }, params) as Promise<CompanyStatsDto>
)

/**
 * Shared by the cards and the table so the two derive identical arguments:
 * `companyStats` is a cache() keyed by positional primitives, so both call
 * sites must land on the same value for `q` to hit one cache entry instead
 * of firing the request twice.
 */
export function companyStatsArgs(params: Record<string, string | string[] | undefined>) {
  const { q } = pageQuery(params)
  return { q }
}

export { companyTotals } from "./totals"
