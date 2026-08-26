import { getListOpportunities } from "@/lib/service"
import type {
  OpportunityDto,
  OpportunityInterest,
  OpportunityStage,
} from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { OpportunityTable } from "./opportunity-table"
import {
  OPPORTUNITY_INTEREST_VALUES,
  OPPORTUNITY_STAGE_VALUES,
} from "./opportunity-meta"
import { opportunityStats } from "./stats"

export async function OpportunityTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const stage = asEnum<OpportunityStage>(firstParam(params.status), OPPORTUNITY_STAGE_VALUES)
  const interest = asEnum<OpportunityInterest>(
    firstParam(params.interest),
    OPPORTUNITY_INTEREST_VALUES
  )
  const source = firstParam(params.source) || undefined

  let results: OpportunityDto[] = []
  let total = 0

  try {
    const response = await getListOpportunities({
      limit,
      offset,
      sort: "DESC",
      q,
      stage,
      interest,
      source,
    })
    ;({ results, total } = pageResult<OpportunityDto>(response))
  } catch (error) {
    console.warn("Failed to load opportunities", error)
  }

  // One grouped read behind the tab counts and the source options, narrowed
  // by the same search and interest as the rows.
  const stats = await opportunityStats(q, interest)

  return (
    <OpportunityTable
      data={results}
      totalCount={total}
      activeStage={stage}
      activeInterest={interest}
      activeSource={source}
      stats={stats}
    />
  )
}
