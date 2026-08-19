import { getListBookings, getListResources, getListMembers, getListCompanies } from "@/lib/service"
import type {
  BookingDto,
  CompanyDto,
  MemberDto,
  ResourceDto,
} from "@/lib/service/HsService"
import {
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { BookingTable } from "./booking-table"

export async function BookingTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: BookingDto[] = []
  let total = 0

  try {
    const response = await getListBookings({
      limit,
      offset,
      sort: "ASC",
      q,
      resourceId: firstParam(params.resourceId),
      from: firstParam(params.from),
      to: firstParam(params.to),
    })
    ;({ results, total } = pageResult<BookingDto>(response))
  } catch (error) {
    console.warn("Failed to load bookings", error)
  }

  // Bookings reference resource and customer by id only.
  let resources: ResourceDto[] = []
  const resourceNames: Record<string, string> = {}
  const memberNames: Record<string, string> = {}
  const companyNames: Record<string, string> = {}

  try {
    const [resourcePage, members, companies] = await Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
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
    />
  )
}
