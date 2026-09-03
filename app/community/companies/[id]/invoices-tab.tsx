import { getListInvoices } from "@/lib/service"
import type { InvoiceDto, InvoiceStatus, CompanyDetailsDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { InvoiceTable } from "@/app/billing/invoices/invoice-table"
import { AddInvoiceButton } from "@/app/billing/invoices/add-invoice-button"
import { INVOICE_STATUS_VALUES } from "@/app/billing/invoices/invoice-status"

export async function InvoicesTab({
  company,
  searchParams,
}: Readonly<{ company: CompanyDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<InvoiceStatus>(firstParam(params.status), INVOICE_STATUS_VALUES)

  let results: InvoiceDto[] = []
  let total = 0
  try {
    const response = await getListInvoices({
      limit,
      offset,
      sort: "DESC",
      q,
      status,
      companyId: company.id,
    })
    ;({ results, total } = pageResult<InvoiceDto>(response))
  } catch (error) {
    console.warn("Failed to load company invoices", error)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Addressed to {company.name}. Invoices sent to individual members live on their pages.
          </p>
        </div>
        <AddInvoiceButton defaultCompanyId={company.id} />
      </div>
      <InvoiceTable
        data={results}
        totalCount={total}
        companyNames={{ [company.id]: company.name }}
        activeStatus={status}
        hideCustomer
      />
    </div>
  )
}
