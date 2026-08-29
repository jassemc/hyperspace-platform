import { getListMembers, getListCompanies } from "@/lib/service"
import type { CompanyDto, MemberDto, MemberStatus } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { MemberTable } from "./member-table"
import { MEMBER_STATUS_VALUES } from "./member-status"
import { memberStats, memberStatsArgs } from "./stats"

export async function MemberTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset } = pageQuery(params)
  // Same helper the cards use, so the two derive identical `q`/`kindHint`
  // and hit the same memberStats() cache entry instead of two requests.
  const { q, kindHint } = memberStatsArgs(params)
  const status = asEnum<MemberStatus>(firstParam(params.status), MEMBER_STATUS_VALUES)

  let results: MemberDto[] = []
  let total = 0
  let companies: CompanyDto[] = []

  // Members carry only `companyId`, so the companies fetch below seeds the
  // employer lookup and the form's option list. It's independent of the
  // member list and stats, so it rides the same Promise.all instead of
  // serialising after them.
  const [response, stats, companiesResponse] = await Promise.all([
    getListMembers({ limit, offset, sort: "ASC", q, status, kindHint }).catch((error) => {
      console.warn("Failed to load members", error)
      return null
    }),
    // Positional, and in the same order as SectionCards' call: cache() keys
    // primitives by value, so this must match section-cards.tsx exactly.
    memberStats(q, kindHint, undefined),
    getListCompanies({ limit: 100, offset: 0, sort: "ASC" }).catch((error) => {
      console.warn("Failed to load companies for member lookup", error)
      return null
    }),
  ])

  if (response) {
    ;({ results, total } = pageResult<MemberDto>(response))
  }

  if (companiesResponse) {
    companies = (companiesResponse.results ?? []) as CompanyDto[]
  }

  return (
    <MemberTable
      data={results}
      totalCount={total}
      companies={companies}
      stats={stats}
      activeStatus={status}
      activeKindHint={kindHint}
    />
  )
}
