import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListExtras } from "@/lib/service"
import type { ExtraDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { ExtraTable } from "./extra-table"

export async function ExtraTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: ExtraDto[] = []
  let total = 0

  try {
    const response = await getListExtras({ limit, offset, sort: "ASC", q })
    ;({ results, total } = pageResult<ExtraDto>(response))
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load extras", error)
  }

  return <ExtraTable data={results} totalCount={total} />
}
