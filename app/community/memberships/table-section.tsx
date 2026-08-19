import { getListMemberships, getListMembers, getListCompanies, getListPlans } from "@/lib/service"
import type {
  CompanyDto,
  MemberDto,
  MembershipDto,
  MembershipStatus,
  PlanDto,
} from "@/lib/service/HsService"
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

  // Memberships reference their customer and plan by id only.
  const memberNames: Record<string, string> = {}
  const companyNames: Record<string, string> = {}
  let plans: PlanDto[] = []

  try {
    const [members, companies, planPage] = await Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
      getListPlans({ limit: 100, offset: 0, sort: "ASC" }),
    ])
    for (const member of (members?.results ?? []) as MemberDto[]) {
      memberNames[member.id] = member.fullName
    }
    for (const company of (companies?.results ?? []) as CompanyDto[]) {
      companyNames[company.id] = company.name
    }
    plans = (planPage?.results ?? []) as PlanDto[]
  } catch (error) {
    console.warn("Failed to load membership lookups", error)
  }

  return (
    <MembershipTable
      data={results}
      totalCount={total}
      memberNames={memberNames}
      companyNames={companyNames}
      plans={plans}
      activeStatus={status}
    />
  )
}
