import { getListBookings } from "@/lib/service"
import type {
  BookingDto,
  BookingSource,
  BookingStatus,
} from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { primaryTimeZone } from "@/lib/locations"
import { BookingTable } from "./booking-table"
import { BOOKING_SOURCE_VALUES, BOOKING_STATUS_VALUES } from "./booking-status"
import { bookingStats } from "./stats"
import { bookingLookups, type BookingLookups } from "./lookups"

export async function BookingTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  const status = asEnum<BookingStatus>(firstParam(params.status), BOOKING_STATUS_VALUES)
  const source = asEnum<BookingSource>(firstParam(params.source), BOOKING_SOURCE_VALUES)
  const resourceId = firstParam(params.resourceId)
  const from = firstParam(params.from)
  const to = firstParam(params.to)
  // #87 (O-01): when the request came in, not when the room is used.
  const createdFrom = firstParam(params.createdFrom)
  const createdTo = firstParam(params.createdTo)

  let results: BookingDto[] = []
  let total = 0

  const [response, stats] = await Promise.all([
    getListBookings({
      limit,
      offset,
      // Upcoming first: the oldest booking ever taken is not what staff
      // open this page to see.
      sort: "DESC",
      q,
      status,
      source,
      resourceId,
      from,
      to,
      createdFrom,
      createdTo,
    }).catch((error) => {
      console.warn("Failed to load bookings", error)
      return null
    }),
    // Positional, and in the same order as SectionCards' call: cache() keys
    // primitives by value, so this must match section-cards.tsx exactly.
    bookingStats(q, resourceId, from, to, source),
  ])

  if (response) {
    ;({ results, total } = pageResult<BookingDto>(response))
  }

  // The rows name their own resource and customer; this list is for the
  // resource filter's options, which need every resource, bookable or not.
  let lookups: BookingLookups = { resources: [], members: [], companies: [] }
  // Table rows may span locations; the column formatter needs one zone, so
  // the first location wins — the single rule, and the single request, that
  // primaryTimeZone() holds for the whole page.
  let timeZone = "UTC"

  try {
    const [loaded, zone] = await Promise.all([
      // canBook: the filter offers only bookable resources (user call,
      // 2026-08-27, overriding the CRUD-parity spec's keep-everything
      // stance) — bookings on a since-retired resource stay visible in
      // the table, they are just no longer filterable by that resource.
      // The same list seeds the create dialog, which wants exactly this;
      // cache() makes this the page's call, not a second one.
      bookingLookups(),
      primaryTimeZone(),
    ])
    lookups = loaded
    // The calendar, which is per-location, uses the zone the API puts on
    // its envelope instead.
    timeZone = zone
  } catch (error) {
    console.warn("Failed to load booking lookups", error)
  }

  return (
    <BookingTable
      data={results}
      totalCount={total}
      resources={lookups.resources}
      members={lookups.members}
      companies={lookups.companies}
      timeZone={timeZone}
      stats={stats}
      activeStatus={status}
      activeSource={source}
      activeResourceId={resourceId}
      activeFrom={from}
      activeTo={to}
      activeCreatedFrom={createdFrom}
      activeCreatedTo={createdTo}
    />
  )
}
