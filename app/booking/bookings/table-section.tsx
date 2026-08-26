import {
  getListBookings,
  getListResources,
  getListMembers,
  getListCompanies,
  getListLocations,
} from "@/lib/service"
import type {
  BookingDto,
  BookingSource,
  BookingStatus,
  CompanyDto,
  LocationDto,
  MemberDto,
  ResourceDto,
} from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { BookingTable } from "./booking-table"
import { BOOKING_SOURCE_VALUES, BOOKING_STATUS_VALUES } from "./booking-status"
import { bookingStats } from "./stats"

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

  const statsQuery = { q, resourceId, from, to, source }

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
    }).catch((error) => {
      console.warn("Failed to load bookings", error)
      return null
    }),
    bookingStats(statsQuery),
  ])

  if (response) {
    ;({ results, total } = pageResult<BookingDto>(response))
  }

  // Bookings reference resource and customer by id only.
  let resources: ResourceDto[] = []
  const resourceNames: Record<string, string> = {}
  const memberNames: Record<string, string> = {}
  const companyNames: Record<string, string> = {}
  let timeZone = "UTC"

  try {
    const [resourcePage, members, companies, locationPage] = await Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
      getListLocations({ limit: 100, offset: 0, sort: "ASC" }),
    ])
    resources = (resourcePage?.results ?? []) as ResourceDto[]
    for (const resource of resources) {
      resourceNames[resource.id] = resource.name
    }
    for (const member of (members?.results ?? []) as MemberDto[]) {
      memberNames[member.id] = member.fullName
    }
    for (const company of (companies?.results ?? []) as CompanyDto[]) {
      companyNames[company.id] = company.name
    }
    // Table rows may span locations; the column formatter needs one zone, so
    // the first location wins. The calendar, which is per-location, uses the
    // zone the API puts on its envelope instead.
    const locations = (locationPage?.results ?? []) as LocationDto[]
    timeZone = locations[0]?.timezone ?? "UTC"
  } catch (error) {
    console.warn("Failed to load booking lookups", error)
  }

  return (
    <BookingTable
      data={results}
      totalCount={total}
      resources={resources}
      resourceNames={resourceNames}
      memberNames={memberNames}
      companyNames={companyNames}
      timeZone={timeZone}
      stats={stats}
      activeStatus={status}
      activeSource={source}
      activeResourceId={resourceId}
      activeFrom={from}
      activeTo={to}
    />
  )
}
