import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListCharges } from "@/lib/service"
import type { ChargeDto, ChargeKind, CompanyDetailsDto } from "@/lib/service/HsService"
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
  company,
  searchParams,
}: Readonly<{ company: CompanyDetailsDto; searchParams?: SearchParamsInput }>) {
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
      companyId: company.id,
      kind: asEnum<ChargeKind>(firstParam(params.kind), CHARGE_KINDS),
      uninvoiced: firstParam(params.uninvoiced) === "true" ? true : undefined,
    })
    ;({ results, total } = pageResult<ChargeDto>(response))
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load company charges", error)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Charges</h2>
          <p className="text-sm text-muted-foreground">
            Charged to {company.name}, newest first.
          </p>
        </div>
        <AddChargeButton defaultCompanyId={company.id} />
      </div>
      <ChargeTable
        data={results}
        totalCount={total}
        companyNames={{ [company.id]: company.name }}
        hideCustomer
      />
    </div>
  )
}
