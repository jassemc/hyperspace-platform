import { cache } from "react"
import { getBookingStats } from "@/lib/service"
import type { BookingSource, BookingStatsDto } from "@/lib/service/HsService"

/**
 * The tabs and the summary cards both want these counts. Memoised per
 * request, so rendering them side by side asks the API once — but only
 * because the signature is positional primitives, not an options object.
 * React's cache() keys primitive arguments by value (a Map, SameValueZero)
 * and object/function arguments by reference (a WeakMap). Two call sites
 * that each build their own `{ q, resourceId, ... }` literal would produce
 * two distinct object references and therefore two cache misses, even with
 * identical contents — so this stays positional on purpose. Resist folding
 * it back into an options object; it would silently double the request.
 */
export const bookingStats = cache(
  async (
    q: string | undefined,
    resourceId: string | undefined,
    from: string | undefined,
    to: string | undefined,
    source: string | undefined
  ): Promise<BookingStatsDto | null> => {
    try {
      return (await getBookingStats({
        q,
        resourceId,
        from,
        to,
        // The API's `source` is the narrower BookingSource enum; this
        // function stays plain strings so callers do not need to import it.
        source: source as BookingSource | undefined,
      })) as BookingStatsDto
    } catch (error) {
      console.warn("Failed to load booking stats", error)
      return null
    }
  }
)

/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function bookingTotals(stats: BookingStatsDto | null) {
  const rows = stats?.byStatus ?? []
  const byStatus = new Map<string, number>(rows.map((row) => [row.status, row.count]))
  const valueByStatus = new Map<string, number>(rows.map((row) => [row.status, row.valueHt]))
  const weeks = stats?.byWeek ?? []
  const busiest = (stats?.byResource ?? [])[0]

  /**
   * Two complete weeks, compared. From nothing to something has no
   * percentage to report, so it goes unsaid rather than being called 100%.
   */
  const changeIn = (key: "created" | "starting") => {
    if (weeks.length < 2) return undefined
    const previous = weeks[weeks.length - 2][key]
    const latest = weeks[weeks.length - 1][key]
    if (previous === 0) return undefined
    return Math.round(((latest - previous) / previous) * 1000) / 10
  }

  return {
    weeks,
    changeIn,
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    valueFor: (status: string) => valueByStatus.get(status) ?? 0,
    total: stats?.total,
    busiestResource: busiest ? { name: busiest.name, count: busiest.count } : null,
  }
}
