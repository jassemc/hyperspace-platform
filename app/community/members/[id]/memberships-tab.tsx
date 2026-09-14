import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListMemberships, getMembershipStats } from "@/lib/service"
import type {
  MemberDetailsDto,
  MembershipDto,
  MembershipStatsDto,
  MembershipStatus,
} from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { MembershipTable } from "@/app/community/memberships/membership-table"
import { AddMembershipButton } from "@/app/community/memberships/add-membership-button"
import { MEMBERSHIP_STATUS_VALUES } from "@/app/community/memberships/membership-status"

/** Direct holdings only (spec §0): `memberId`, never the employer's roster. */
export async function MembershipsTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)

  const [response, stats] = await Promise.all([
    getListMemberships({ limit, offset, sort: "DESC", q, status, memberId: member.id }).catch(
      (error) => {
        escalateAuthError(error)
        console.warn("Failed to load member memberships", error)
        return null
      }
    ),
    getMembershipStats({ memberId: member.id, q }).catch(() => null),
  ])
  const { results, total } = response
    ? pageResult<MembershipDto>(response)
    : { results: [], total: 0 }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Memberships</h2>
          <p className="text-sm text-muted-foreground">Held directly by {member.fullName}.</p>
        </div>
        <AddMembershipButton defaultMemberId={member.id} />
      </div>
      <MembershipTable
        data={results}
        totalCount={total}
        stats={stats as MembershipStatsDto | null}
        activeStatus={status}
        hideCustomer
        showPlanFilter={false}
        defaultMemberId={member.id}
      />
    </div>
  )
}
