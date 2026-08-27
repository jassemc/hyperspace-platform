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

  const weekLabels = totals.weeks.map((entry) =>
    new Date(entry.week).toLocaleDateString(undefined, { day: "numeric", month: "short" })
  )

  return (
    <StatCards
      cards={[
        {
          label: "Bookings taken",
          value: totals.weeks.at(-1)?.created ?? 0,
          unit: "this week",
          icon: CalendarCheckIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels,
          // The calendar scopes itself by date/calendarView, which this
          // total does not read — so in calendar view it must not claim
          // to match the filters shown, only give the true, wider count.
          footer:
            view === "calendar"
              ? `${stats?.total ?? 0} bookings in total, not just the days shown`
              : `${stats?.total ?? 0} matching the current filters`,
        },
        {
          label: "Starting",
          value: totals.weeks.at(-1)?.starting ?? 0,
          unit: "this week",
          icon: ClockIcon,
          delta: totals.changeIn("starting"),
          series: totals.weeks.map((entry) => entry.starting),
          seriesLabels: weekLabels,
          footer: totals.busiestResource
            ? `Busiest room: ${totals.busiestResource.name} (${totals.busiestResource.count})`
            : "No room booked yet",
        },
        {
          label: "Cancelled",
          value: count("cancelled"),
          badge: "Released",
          icon: XCircleIcon,
          // The figure that makes a cancellation card mean anything.
          footer: `${formatPriceHt(totals.valueFor("cancelled"))} released`,
        },
        {
          label: "Booked value",
          value: formatPriceHt(stats?.bookedValueHt ?? 0),
          badge: "HT",
          icon: CoinsIcon,
          series: totals.weeks.map((entry) => entry.bookedValueHt),
          seriesLabels: weekLabels,
          footer: "Credit-covered bookings count as zero",
        },
      ]}
    />
  )
}
