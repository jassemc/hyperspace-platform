import { getListPlanCategories } from "@/lib/service"
import type { PlanCategoryDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { PlanCategoryTable } from "./plan-category-table"

export async function PlanCategoryTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: PlanCategoryDto[] = []
  let total = 0

  try {
    // The API returns them in display order.
    const response = await getListPlanCategories({ limit, offset, sort: "ASC", q })
    ;({ results, total } = pageResult<PlanCategoryDto>(response))
  } catch (error) {
    console.warn("Failed to load plan categories", error)
  }

  return <PlanCategoryTable data={results} totalCount={total} />
}
