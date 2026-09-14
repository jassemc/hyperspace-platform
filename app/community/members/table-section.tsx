import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListMembers } from "@/lib/service"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
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
  // Same helper the cards use, so the two derive identical `q`/`kindHint`/
  // created bounds and hit the same memberStats() cache entry instead of
  // two requests.
  const { q, kindHint, createdFrom, createdTo } = memberStatsArgs(params)
  const status = asEnum<MemberStatus>(firstParam(params.status), MEMBER_STATUS_VALUES)

  let results: MemberDto[] = []
  let total = 0

  const [response, stats] = await Promise.all([
    getListMembers({
      limit,
      offset,
      sort: "ASC",
      q,
      status,
      kindHint,
      createdFrom,
      createdTo,
    }).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load members", error)
      return null
    }),
    // Positional, and in the same order as SectionCards' call: cache() keys
    // primitives by value, so this must match section-cards.tsx exactly.
    memberStats(q, kindHint, undefined, createdFrom, createdTo),
  ])

  if (response) {
    ;({ results, total } = pageResult<MemberDto>(response))
  }

  return (
    <MemberTable
      data={results}
      totalCount={total}
      stats={stats}
      activeStatus={status}
      activeKindHint={kindHint}
      activeCreatedFrom={createdFrom}
      activeCreatedTo={createdTo}
    />
  )
}
