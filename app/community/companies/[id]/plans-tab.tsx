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
import { MEMBERSHIP_STATUS_VALUES } from "@/app/community/memberships/membership-status"
import { membershipStats } from "@/app/community/memberships/stats"
import { CompanyPlansTable } from "./company-plans-table"
import { SubscribePlanButton } from "./subscribe-plan-button"

export async function PlansTab({
  companyId,
  companyName,
  searchParams,
}: Readonly<{
  companyId: string
  companyName: string
  searchParams?: SearchParamsInput
}>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)

  let results: MembershipDto[] = []
  let total = 0

  const [response, stats] = await Promise.all([
    getListMemberships({
      limit,
      offset,
      sort: "DESC",
      q,
      status,
      forCompanyId: companyId,
    }).catch((error) => {
      console.warn(`Failed to load memberships for company ${companyId}`, error)
      return null
    }),
    // Positional, and in the same order as the memberships module's other
    // call sites: cache() keys primitives by value, so this must match.
    membershipStats(q, undefined, undefined, companyId),
  ])

  if (response) {
    ;({ results, total } = pageResult<MembershipDto>(response))
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Plans</h2>
          <p className="text-sm text-muted-foreground">
            Memberships held by {companyName} or its members.
          </p>
        </div>
        <SubscribePlanButton companyId={companyId} />
      </div>
      <CompanyPlansTable
        data={results}
        totalCount={total}
        companyId={companyId}
        activeStatus={status}
        stats={stats}
      />
    </div>
  )
}
