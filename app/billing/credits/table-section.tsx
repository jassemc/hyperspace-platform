import { getListCredits, getListResourceTypes } from "@/lib/service"
import type { CreditTransactionDto, CreditTransactionKind, ResourceTypeDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { CreditTable } from "./credit-table"

const CREDIT_KINDS: CreditTransactionKind[] = ["grant", "consumption"]

export async function CreditTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: CreditTransactionDto[] = []
  let total = 0

  try {
    const response = await getListCredits({
      limit,
      offset,
      sort: "DESC",
      q,
      kind: asEnum<CreditTransactionKind>(firstParam(params.kind), CREDIT_KINDS),
      membershipId: firstParam(params.membershipId),
      memberId: firstParam(params.memberId),
    })
    ;({ results, total } = pageResult<CreditTransactionDto>(response))
  } catch (error) {
    console.warn("Failed to load credits", error)
  }

  // Credits can be scoped to a resource type, referenced by id only.
  const resourceTypeNames: Record<string, string> = {}
  try {
    const types = await getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
    for (const type of (types?.results ?? []) as ResourceTypeDto[]) {
      resourceTypeNames[type.id] = type.name
    }
  } catch (error) {
    console.warn("Failed to load resource types for credits", error)
  }

  return <CreditTable data={results} totalCount={total} resourceTypeNames={resourceTypeNames} />
}
