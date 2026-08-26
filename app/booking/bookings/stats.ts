import { cache } from "react"
import { getBookingStats } from "@/lib/service"
import type { BookingStatsDto, GetBookingStatsParams } from "@/lib/service/HsService"

export interface BookingStatsQuery {
  q?: string
  resourceId?: string
  from?: string
  to?: string
  source?: string
  memberId?: string
  companyId?: string
}

/**
 * The tabs and the summary cards both want these counts. Memoised per
 * request, so rendering them side by side asks the API once. Always call
 * it with the argument: cache() keys on the argument list, and f() is not
 * f(undefined).
 */
export const bookingStats = cache(
  async (query: BookingStatsQuery): Promise<BookingStatsDto | null> => {
    try {
      // The API's `source` is the narrower BookingSource enum; this query
      // shape stays plain strings so callers do not need to import it.
      return (await getBookingStats(query as GetBookingStatsParams)) as BookingStatsDto
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
