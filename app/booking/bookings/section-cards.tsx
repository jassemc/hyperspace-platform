import { StatCards } from "@/components/stat-cards"
import { CalendarCheckIcon, ClockIcon, XCircleIcon, CoinsIcon } from "lucide-react"
import { formatPriceHt } from "@/lib/format"
import {
  asEnum,
  firstParam,
  pageQuery,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import type { BookingSource } from "@/lib/service/HsService"
import { BOOKING_SOURCE_VALUES } from "./booking-status"
import { bookingStats, bookingTotals } from "./stats"

export async function SectionCards({
  searchParams,
  view = "table",
}: Readonly<{
  searchParams?: SearchParamsInput
  /**
   * The calendar scopes itself by `date` and `calendarView`, which these
   * counts do not read — they read `from`/`to`/`q`/`source`/`resourceId`.
   * So in calendar view the total is not "the days you are looking at",
   * and saying it matches the current filters would be a false claim,
   * which is worse than no claim at all.
   */
  view?: "table" | "calendar"
}>) {
  const params = await resolveSearchParams(searchParams)
  const { q } = pageQuery(params)

  // Same five values, same order, as the table's call: cache() keys
  // primitive arguments by value, so this dedupes into a single request
  // only because both call sites pass positional primitives, not an
  // options object (objects would be keyed by reference and always miss).
  // `source` must go through the same asEnum narrowing the table uses —
  // otherwise a stale or hand-edited value produces a different cache key
  // (and a different summary population) between the two sections.
  const stats = await bookingStats(
    q,
    firstParam(params.resourceId),
    firstParam(params.from),
    firstParam(params.to),
    asEnum<BookingSource>(firstParam(params.source), BOOKING_SOURCE_VALUES)
  )

  const totals = bookingTotals(stats)
  const count = (status: string) => totals.countFor(status) ?? 0

  return (
    <StatCards
      cards={[
        { label: "Total bookings", value: stats?.total ?? 0, badge: "All", icon: CalendarCheckIcon, footer: view === "calendar" ? "All bookings, not just the days shown" : "Matching the current filters" },
        { label: "Pending", value: count("pending"), badge: "To confirm", icon: ClockIcon, footer: "Awaiting confirmation" },
        { label: "Cancelled", value: count("cancelled"), badge: "Released", icon: XCircleIcon, footer: "Slots freed again" },
        { label: "Booked value", value: formatPriceHt(stats?.bookedValueHt ?? 0), badge: "HT", icon: CoinsIcon, footer: "Credit-covered bookings count as zero" },
      ]}
    />
  )
}
