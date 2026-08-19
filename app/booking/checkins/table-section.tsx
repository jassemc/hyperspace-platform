import { getListCheckins, getListMembers, getListLocations } from "@/lib/service"
import type { CheckinDto, LocationDto, MemberDto } from "@/lib/service/HsService"
import {
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { CheckinTable } from "./checkin-table"

export async function CheckinTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: CheckinDto[] = []
  let total = 0

  try {
    const response = await getListCheckins({
      limit,
      offset,
      sort: "DESC",
      q,
      from: firstParam(params.from),
      to: firstParam(params.to),
      memberId: firstParam(params.memberId),
    })
    ;({ results, total } = pageResult<CheckinDto>(response))
  } catch (error) {
    console.warn("Failed to load check-ins", error)
  }

  // Check-ins reference member and location by id only.
  const memberNames: Record<string, string> = {}
  const locationNames: Record<string, string> = {}

  try {
    const [members, locations] = await Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListLocations({ limit: 100, offset: 0, sort: "ASC" }),
    ])
    for (const member of (members?.results ?? []) as MemberDto[]) {
      memberNames[member.id] = member.fullName
    }
    for (const location of (locations?.results ?? []) as LocationDto[]) {
      locationNames[location.id] = location.name
    }
  } catch (error) {
    console.warn("Failed to load check-in lookups", error)
  }

  return (
    <CheckinTable
      data={results}
      totalCount={total}
      memberNames={memberNames}
      locationNames={locationNames}
    />
  )
}
