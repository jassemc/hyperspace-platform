import { getListOpportunities, getListMembers } from "@/lib/service"
import type { MemberDto, OpportunityDto, OpportunityStage } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { OpportunityTable } from "./opportunity-table"
import { OPPORTUNITY_STAGE_VALUES } from "./opportunity-meta"

export async function OpportunityTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const stage = asEnum<OpportunityStage>(firstParam(params.status), OPPORTUNITY_STAGE_VALUES)

  let results: OpportunityDto[] = []
  let total = 0

  try {
    const response = await getListOpportunities({ limit, offset, sort: "DESC", q, stage })
    ;({ results, total } = pageResult<OpportunityDto>(response))
  } catch (error) {
    console.warn("Failed to load opportunities", error)
  }

  // Opportunities reference their member by id only.
  const memberNames: Record<string, string> = {}
  try {
    const members = await getListMembers({ limit: 100, offset: 0, sort: "ASC" })
    for (const member of (members?.results ?? []) as MemberDto[]) {
      memberNames[member.id] = member.fullName
    }
  } catch (error) {
    console.warn("Failed to load members for opportunities", error)
  }

  return (
    <OpportunityTable
      data={results}
      totalCount={total}
      memberNames={memberNames}
      activeStage={stage}
    />
  )
}
