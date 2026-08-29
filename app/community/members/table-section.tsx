import { getListMembers, getListCompanies } from "@/lib/service"
import type { CompanyDto, MemberDto, MemberKindHint } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { MemberTable } from "./member-table"
import { MEMBER_KIND_HINT_VALUES } from "./member-status"

export async function MemberTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  // The shared table writes its tab selection to `status`; for members that
  // selection is a kindHint, the only lifecycle filter the endpoint accepts.
  const kindHint = asEnum<MemberKindHint>(firstParam(params.status), MEMBER_KIND_HINT_VALUES)

  let results: MemberDto[] = []
  let total = 0

  try {
    const response = await getListMembers({ limit, offset, sort: "ASC", q, kindHint })
    ;({ results, total } = pageResult<MemberDto>(response))
  } catch (error) {
    console.warn("Failed to load members", error)
  }

  // Members carry only `companyId`, so resolve employer names for the table.
  const companyNames: Record<string, string> = {}
  try {
    const companies = await getListCompanies({ limit: 100, offset: 0, sort: "ASC" })
    for (const company of (companies?.results ?? []) as CompanyDto[]) {
      companyNames[company.id] = company.name
    }
  } catch (error) {
    console.warn("Failed to load companies for member lookup", error)
  }

  return (
    <MemberTable
      data={results}
      totalCount={total}
      companyNames={companyNames}
      activeKindHint={kindHint}
    />
  )
}
