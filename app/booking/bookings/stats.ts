import { getBookingStats } from "@/lib/service"
import type { BookingSource, BookingStatsDto } from "@/lib/service/HsService"
import { cachedStats } from "@/lib/cached-stats"

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
export const bookingStats = cachedStats(
  "stats:bookings",
  (
    params,
    q: string | undefined,
    resourceId: string | undefined,
    from: string | undefined,
    to: string | undefined,
    source: string | undefined
  ) =>
    getBookingStats(
      {
        q,
        resourceId,
        from,
        to,
        // The API's `source` is the narrower BookingSource enum; this
        // function stays plain strings so callers do not need to import it.
        source: source as BookingSource | undefined,
      },
      params
    ) as Promise<BookingStatsDto>
)

export { bookingTotals } from "./totals"
