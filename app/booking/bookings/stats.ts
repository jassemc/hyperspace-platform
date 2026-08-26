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
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  return {
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    total: stats?.total,
  }
}
