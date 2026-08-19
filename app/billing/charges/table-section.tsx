import { getListCharges, getListMembers, getListCompanies } from "@/lib/service"
import type { ChargeDto, ChargeKind, CompanyDto, MemberDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { ChargeTable } from "./charge-table"
import { CHARGE_KINDS } from "./charge-meta"

export async function ChargeTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
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
      kind: asEnum<ChargeKind>(firstParam(params.kind), CHARGE_KINDS),
      // `?uninvoiced=true` narrows to what can still be put on an invoice.
      uninvoiced: firstParam(params.uninvoiced) === "true" ? true : undefined,
    })
    ;({ results, total } = pageResult<ChargeDto>(response))
  } catch (error) {
    console.warn("Failed to load charges", error)
  }

  const memberNames: Record<string, string> = {}
  const companyNames: Record<string, string> = {}

  try {
    const [members, companies] = await Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
    ])
    for (const member of (members?.results ?? []) as MemberDto[]) {
      memberNames[member.id] = member.fullName
    }
    for (const company of (companies?.results ?? []) as CompanyDto[]) {
      companyNames[company.id] = company.name
    }
  } catch (error) {
    console.warn("Failed to load charge lookups", error)
  }

  return (
    <ChargeTable
      data={results}
      totalCount={total}
      memberNames={memberNames}
      companyNames={companyNames}
    />
  )
}
