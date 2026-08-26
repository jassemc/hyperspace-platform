import { StatCards } from "@/components/stat-cards"
import { CalendarCheckIcon, ClockIcon, XCircleIcon, CoinsIcon } from "lucide-react"
import { formatPriceHt } from "@/lib/format"
import {
  firstParam,
  pageQuery,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { bookingStats, bookingTotals } from "./stats"

export async function SectionCards({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { q } = pageQuery(params)

  // Same five values, same order, as the table's call: cache() keys
  // primitive arguments by value, so this dedupes into a single request
  // only because both call sites pass positional primitives, not an
  // options object (objects would be keyed by reference and always miss).
  const stats = await bookingStats(
    q,
    firstParam(params.resourceId),
    firstParam(params.from),
    firstParam(params.to),
    firstParam(params.source)
  )

  const totals = bookingTotals(stats)
  const count = (status: string) => totals.countFor(status) ?? 0

  return (
    <StatCards
      cards={[
        { label: "Total bookings", value: stats?.total ?? 0, badge: "All", icon: CalendarCheckIcon, footer: "Matching the current filters" },
        { label: "Pending", value: count("pending"), badge: "To confirm", icon: ClockIcon, footer: "Awaiting confirmation" },
        { label: "Cancelled", value: count("cancelled"), badge: "Released", icon: XCircleIcon, footer: "Slots freed again" },
        { label: "Booked value", value: formatPriceHt(stats?.bookedValueHt ?? 0), badge: "HT", icon: CoinsIcon, footer: "Credit-covered bookings count as zero" },
      ]}
    />
  )
}
