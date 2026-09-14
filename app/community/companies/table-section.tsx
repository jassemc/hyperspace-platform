import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListCompanies } from "@/lib/service"
import type { CompanyDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { CompanyTable } from "./company-table"
import { companyStats, companyStatsArgs } from "./stats"

export async function CompanyTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset } = pageQuery(params)
  // Same helper the cards use, so the two derive identical `q` and hit the
  // same companyStats() cache entry instead of two requests.
  const { q } = companyStatsArgs(params)

  let results: CompanyDto[] = []
  let total = 0

  const [response] = await Promise.all([
    getListCompanies({ limit, offset, sort: "ASC", q }).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load companies", error)
      return null
    }),
    // The list has no status tabs, so the table doesn't need the result —
    // but calling it with the same args as SectionCards hits the shared
    // companyStats() cache entry instead of leaving it a miss.
    companyStats(q),
  ])

  if (response) {
    ;({ results, total } = pageResult<CompanyDto>(response))
  }

  return <CompanyTable data={results} totalCount={total} />
}
