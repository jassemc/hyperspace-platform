import { getListCompanies } from "@/lib/service"
import type { CompanyDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { CompanyTable } from "./company-table"

export async function CompanyTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: CompanyDto[] = []
  let total = 0

  try {
    const response = await getListCompanies({ limit, offset, sort: "ASC", q })
    ;({ results, total } = pageResult<CompanyDto>(response))
  } catch (error) {
    console.warn("Failed to load companies", error)
  }

  return <CompanyTable data={results} totalCount={total} />
}
