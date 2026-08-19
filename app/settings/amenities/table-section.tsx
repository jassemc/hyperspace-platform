import { getListAmenities } from "@/lib/service"
import type { AmenityDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { AmenityTable } from "./amenity-table"

export async function AmenityTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: AmenityDto[] = []
  let total = 0

  try {
    const response = await getListAmenities({ limit, offset, sort: "ASC", q })
    ;({ results, total } = pageResult<AmenityDto>(response))
  } catch (error) {
    console.warn("Failed to load amenities", error)
  }

  return <AmenityTable data={results} totalCount={total} />
}
