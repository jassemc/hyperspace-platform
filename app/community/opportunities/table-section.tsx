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
  // ISO instants, not day strings: an opportunity has no location, so the
  // server has no timezone in which to decide what "a day" means. The
  // client converts the picked day into this pair of instants, in the
  // reader's own zone.
  const createdFrom = firstParam(params.createdFrom)
  const createdTo = firstParam(params.createdTo)

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
      createdFrom,
      createdTo,
    })
    ;({ results, total } = pageResult<OpportunityDto>(response))
  } catch (error) {
    console.warn("Failed to load opportunities", error)
  }

  // One grouped read behind the tab counts and the source options, narrowed
  // by the same search, interest and created-date bounds as the rows — so
  // the stage tab counts always label the set of rows on screen.
  const stats = await opportunityStats(q, interest, createdFrom, createdTo)

  return (
    <OpportunityTable
      data={results}
      totalCount={total}
      activeStage={stage}
      activeInterest={interest}
      activeSource={source}
      activeCreatedFrom={createdFrom}
      activeCreatedTo={createdTo}
      stats={stats}
    />
  )
}
