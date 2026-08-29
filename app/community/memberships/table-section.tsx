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

export async function MembershipTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)

  let results: MembershipDto[] = []
  let total = 0

  try {
    const response = await getListMemberships({ limit, offset, sort: "ASC", q, status })
    ;({ results, total } = pageResult<MembershipDto>(response))
  } catch (error) {
    console.warn("Failed to load memberships", error)
  }

  return <MembershipTable data={results} totalCount={total} activeStatus={status} />
}
