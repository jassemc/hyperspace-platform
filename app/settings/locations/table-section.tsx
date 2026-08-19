import { getListLocations } from "@/lib/service"
import type { LocationDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { LocationTable } from "./location-table"

export async function LocationTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: LocationDto[] = []
  let total = 0

  try {
    const response = await getListLocations({ limit, offset, sort: "ASC", q })
    ;({ results, total } = pageResult<LocationDto>(response))
  } catch (error) {
    console.warn("Failed to load locations", error)
  }

  return <LocationTable data={results} totalCount={total} />
}
