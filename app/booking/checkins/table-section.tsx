import { getListCheckins, getListLocations } from "@/lib/service"
import type { CheckinDto, LocationDto } from "@/lib/service/HsService"
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

  // The member's name travels on the check-in itself (#85); only the
  // location still needs resolving, and locations are few.
  const locationNames: Record<string, string> = {}

  try {
    const locations = await getListLocations({ limit: 100, offset: 0, sort: "ASC" })
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
      locationNames={locationNames}
    />
  )
}
