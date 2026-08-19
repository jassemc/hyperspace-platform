import { getListAssignments, getListResources, getListMemberships } from "@/lib/service"
import type { AssignmentDto, MembershipDto, ResourceDto } from "@/lib/service/HsService"
import {
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { AssignmentTable } from "./assignment-table"

export async function AssignmentTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: AssignmentDto[] = []
  let total = 0

  try {
    const response = await getListAssignments({
      limit,
      offset,
      sort: "ASC",
      q,
      resourceId: firstParam(params.resourceId),
      membershipId: firstParam(params.membershipId),
      activeOn: firstParam(params.activeOn),
    })
    ;({ results, total } = pageResult<AssignmentDto>(response))
  } catch (error) {
    console.warn("Failed to load assignments", error)
  }

  // Assignments reference resource and membership by id only.
  let resources: ResourceDto[] = []
  let memberships: MembershipDto[] = []
  const resourceNames: Record<string, string> = {}
  const membershipNames: Record<string, string> = {}

  try {
    const [resourcePage, membershipPage] = await Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      getListMemberships({ limit: 100, offset: 0, sort: "ASC" }),
    ])
    resources = (resourcePage?.results ?? []) as ResourceDto[]
    memberships = (membershipPage?.results ?? []) as MembershipDto[]
    for (const resource of resources) {
      resourceNames[resource.id] = resource.name
    }
    for (const membership of memberships) {
      membershipNames[membership.id] = membership.name
    }
  } catch (error) {
    console.warn("Failed to load assignment lookups", error)
  }

  return (
    <AssignmentTable
      data={results}
      totalCount={total}
      resources={resources}
      memberships={memberships}
      resourceNames={resourceNames}
      membershipNames={membershipNames}
    />
  )
}
