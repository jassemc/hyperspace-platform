import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListInvoices, getListMembers, getListCompanies } from "@/lib/service"
import type { CompanyDto, InvoiceDto, InvoiceStatus, MemberDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { InvoiceTable } from "./invoice-table"
import { INVOICE_STATUS_VALUES } from "./invoice-status"

export async function InvoiceTableSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<InvoiceStatus>(firstParam(params.status), INVOICE_STATUS_VALUES)

  let results: InvoiceDto[] = []
  let total = 0

  try {
    const response = await getListInvoices({ limit, offset, sort: "DESC", q, status })
    ;({ results, total } = pageResult<InvoiceDto>(response))
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load invoices", error)
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
    escalateAuthError(error)
    console.warn("Failed to load invoice lookups", error)
  }

  return (
    <InvoiceTable
      data={results}
      totalCount={total}
      memberNames={memberNames}
      companyNames={companyNames}
      activeStatus={status}
    />
  )
}
