import { getListMemberships } from "@/lib/service"
import type { MembershipDto, MembershipStatus } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { MembershipTable } from "./membership-table"
import { MEMBERSHIP_STATUS_VALUES } from "./membership-status"
import { membershipStats, membershipStatsArgs } from "./stats"

export async function MembershipTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset } = pageQuery(params)
  // Same helper the cards use, so the two derive identical `q`/`planId` and
  // hit the same membershipStats() cache entry instead of two requests.
  const { q, planId } = membershipStatsArgs(params)
  const status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)

  let results: MembershipDto[] = []
  let total = 0

  const [response, stats] = await Promise.all([
    getListMemberships({ limit, offset, sort: "ASC", q, status, planId }).catch((error) => {
      console.warn("Failed to load memberships", error)
      return null
    }),
    // Positional, and in the same order as SectionCards' call: cache() keys
    // primitives by value, so this must match section-cards.tsx exactly.
    membershipStats(q, planId, undefined, undefined),
  ])

  if (response) {
    ;({ results, total } = pageResult<MembershipDto>(response))
  }

  return (
    <MembershipTable
      data={results}
      totalCount={total}
      stats={stats}
      activeStatus={status}
      activePlanId={planId}
    />
  )
}
