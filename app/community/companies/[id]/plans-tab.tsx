import { getListMembers, getListMemberships, getListPlans, getPlan } from "@/lib/service"
import type { MemberDto, MembershipDto, PlanDto } from "@/lib/service/HsService"
import { CompanyPlansTable } from "./company-plans-table"
import { SubscribePlanButton } from "./subscribe-plan-button"

type MembershipsPage = { results?: MembershipDto[]; meta?: { totalItems?: number } }
type MembersPage = { results?: MemberDto[] }
type PlansPage = { results?: PlanDto[] }

const MEMBERSHIP_PAGE_SIZE = 100
const MAX_MEMBERSHIP_PAGES = 10
const MEMBER_PAGE_SIZE = 100

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** Every member of the company, keyed by id — these are the possible subscribers. */
async function loadCompanyMembers(companyId: string): Promise<Map<string, string>> {
  const membersById = new Map<string, string>()

  try {
    const response = (await getListMembers({
      limit: MEMBER_PAGE_SIZE,
      offset: 0,
      sort: "ASC",
      companyId,
    })) as MembersPage

    for (const member of response.results ?? []) {
      membersById.set(member.id, member.fullName)
    }
  } catch (error) {
    console.warn(`Failed to load members of company ${companyId}`, error)
  }

  return membersById
}

/**
 * A membership is member XOR company, and subscriptions created here are written
 * against the member, so the tab collects both: memberships held by this
 * company's members, plus any company-level ones. GET /memberships has no filter
 * for either, so pages are pulled and sifted here; the scan is capped and the cap
 * is logged rather than silently truncating.
 */
async function loadCompanyMemberships(
  companyId: string,
  memberIds: Set<string>
): Promise<MembershipDto[]> {
  const collected: MembershipDto[] = []

  const belongsToCompany = (membership: MembershipDto) =>
    membership.companyId === companyId ||
    Boolean(membership.memberId && memberIds.has(membership.memberId))

  for (let pageIndex = 0; pageIndex < MAX_MEMBERSHIP_PAGES; pageIndex++) {
    let batch: MembershipDto[] = []

    try {
      const response = (await getListMemberships({
        limit: MEMBERSHIP_PAGE_SIZE,
        offset: pageIndex * MEMBERSHIP_PAGE_SIZE,
        sort: "DESC",
      })) as MembershipsPage
      batch = response.results ?? []
    } catch (error) {
      console.warn("Failed to load memberships", error)
      return collected
    }

    collected.push(...batch.filter(belongsToCompany))

    if (batch.length < MEMBERSHIP_PAGE_SIZE) return collected

    if (pageIndex === MAX_MEMBERSHIP_PAGES - 1) {
      console.warn(
        `Membership scan capped at ${MAX_MEMBERSHIP_PAGES * MEMBERSHIP_PAGE_SIZE} records; ` +
          `company ${companyId} may have memberships that are not shown. ` +
          "A companyId/memberId filter on GET /memberships would remove this limit."
      )
    }
  }

  return collected
}

/** Memberships carry only planId, and the plan may since have been archived. */
async function resolvePlanNames(memberships: MembershipDto[]): Promise<Record<string, string>> {
  const wantedIds = [...new Set(memberships.map((membership) => membership.planId).filter(Boolean))]
  if (wantedIds.length === 0) return {}

  const plansById: Record<string, string> = {}

  try {
    const response = (await getListPlans({ limit: 100, offset: 0, sort: "ASC" })) as PlansPage
    for (const plan of response.results ?? []) {
      plansById[plan.id] = plan.name
    }
  } catch (error) {
    console.warn("Failed to load plans for membership name lookup", error)
  }

  const missingIds = wantedIds.filter((id) => !plansById[id])
  if (missingIds.length > 0) {
    const fetched = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const plan = (await getPlan(id)) as PlanDto
          return [id, plan.name] as const
        } catch (error) {
          console.warn(`Failed to resolve plan ${id}`, error)
          return null
        }
      })
    )

    for (const entry of fetched) {
      if (entry) plansById[entry[0]] = entry[1]
    }
  }

  return plansById
}

export async function PlansTab({
  companyId,
  companyName,
  searchParams,
}: Readonly<{
  companyId: string
  companyName: string
  searchParams?: Record<string, string | string[] | undefined>
}>) {
  const page = Number(firstParam(searchParams?.page)) || 1
  const pageSize = Number(firstParam(searchParams?.pageSize)) || 10
  const searchQuery = firstParam(searchParams?.name)?.trim().toLowerCase()

  const membersById = await loadCompanyMembers(companyId)
  const memberships = await loadCompanyMemberships(companyId, new Set(membersById.keys()))
  const plansById = await resolvePlanNames(memberships)

  const subscriberFor = (membership: MembershipDto) =>
    (membership.memberId ? membersById.get(membership.memberId) : undefined) ??
    (membership.companyId === companyId ? companyName : "Unknown")

  const subscribersById: Record<string, string> = Object.fromEntries(
    memberships.map((membership) => [membership.id, subscriberFor(membership)])
  )

  // The company scope and the search both run here rather than in the API, so
  // paging is applied to the filtered set instead of the raw list.
  const filtered = searchQuery
    ? memberships.filter((membership) => {
        const planName = plansById[membership.planId] || membership.planId
        const subscriber = subscribersById[membership.id] ?? ""
        return (
          planName.toLowerCase().includes(searchQuery) ||
          subscriber.toLowerCase().includes(searchQuery)
        )
      })
    : memberships

  const start = (page - 1) * pageSize
  const pageRows = filtered.slice(start, start + pageSize)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Plans</h2>
          <p className="text-sm text-muted-foreground">
            Memberships held by this company&apos;s members.
          </p>
        </div>
        <SubscribePlanButton companyId={companyId} />
      </div>
      <CompanyPlansTable
        data={pageRows}
        totalCount={filtered.length}
        companyId={companyId}
        plansById={plansById}
        subscribersById={subscribersById}
      />
    </div>
  )
}
