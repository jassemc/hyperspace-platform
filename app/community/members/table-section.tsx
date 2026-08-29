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

  const [response, stats] = await Promise.all([
    getListMembers({ limit, offset, sort: "ASC", q, status, kindHint }).catch((error) => {
      console.warn("Failed to load members", error)
      return null
    }),
    // Positional, and in the same order as SectionCards' call: cache() keys
    // primitives by value, so this must match section-cards.tsx exactly.
    memberStats(q, kindHint, undefined),
  ])

  if (response) {
    ;({ results, total } = pageResult<MemberDto>(response))
  }

  // Members carry only `companyId`, so this seeds the employer lookup and
  // the form's option list — the same list Task 3 wires into the form.
  let companies: CompanyDto[] = []
  try {
    const loaded = await getListCompanies({ limit: 100, offset: 0, sort: "ASC" })
    companies = (loaded?.results ?? []) as CompanyDto[]
  } catch (error) {
    console.warn("Failed to load companies for member lookup", error)
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
