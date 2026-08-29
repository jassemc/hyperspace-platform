import { getListCredits, getListResourceTypes } from "@/lib/service"
import type {
  CreditTransactionDto,
  CreditTransactionKind,
  MemberDetailsDto,
  ResourceTypeDto,
} from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { CreditTable } from "@/app/billing/credits/credit-table"
import { AddCreditButton } from "@/app/billing/credits/add-credit-button"

const CREDIT_KINDS: CreditTransactionKind[] = ["grant", "consumption"]

/**
 * The ledger's `memberId` means "spendable by this person" — their own
 * memberships plus the employer's pooled ones (spec §0) — so this tab can
 * show rows from a company plan the member draws on.
 */
export async function CreditsTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const kind = asEnum<CreditTransactionKind>(firstParam(params.kind), CREDIT_KINDS)

  const [response, types] = await Promise.all([
    getListCredits({ limit, offset, sort: "DESC", q, kind, memberId: member.id }).catch(
      (error) => {
        console.warn("Failed to load member credits", error)
        return null
      }
    ),
    getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
  ])
  const { results, total } = response
    ? pageResult<CreditTransactionDto>(response)
    : { results: [], total: 0 }

  const resourceTypeNames: Record<string, string> = {}
  for (const type of (types?.results ?? []) as ResourceTypeDto[]) {
    resourceTypeNames[type.id] = type.name
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Credits</h2>
          <p className="text-sm text-muted-foreground">
            Grants and consumption on the memberships {member.fullName} can draw on.
          </p>
        </div>
        <AddCreditButton defaultMemberId={member.id} />
      </div>
      <CreditTable data={results} totalCount={total} resourceTypeNames={resourceTypeNames} />
    </div>
  )
}
