import { getListCharges } from "@/lib/service"
import type { ChargeDto, ChargeKind, MemberDetailsDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { ChargeTable } from "@/app/billing/charges/charge-table"
import { AddChargeButton } from "@/app/billing/charges/add-charge-button"
import { CHARGE_KINDS } from "@/app/billing/charges/charge-meta"

export async function ChargesTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: ChargeDto[] = []
  let total = 0
  try {
    const response = await getListCharges({
      limit,
      offset,
      sort: "DESC",
      q,
      memberId: member.id,
      kind: asEnum<ChargeKind>(firstParam(params.kind), CHARGE_KINDS),
      uninvoiced: firstParam(params.uninvoiced) === "true" ? true : undefined,
    })
    ;({ results, total } = pageResult<ChargeDto>(response))
  } catch (error) {
    console.warn("Failed to load member charges", error)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Charges</h2>
          <p className="text-sm text-muted-foreground">
            Charged to {member.fullName} personally, newest first.
          </p>
        </div>
        <AddChargeButton defaultMemberId={member.id} />
      </div>
      <ChargeTable
        data={results}
        totalCount={total}
        memberNames={{ [member.id]: member.fullName }}
        hideCustomer
      />
    </div>
  )
}
