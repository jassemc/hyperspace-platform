import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListInvoices } from "@/lib/service"
import type { InvoiceDto, InvoiceStatus, MemberDetailsDto } from "@/lib/service/HsService"
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
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
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
      memberId: member.id,
    })
    ;({ results, total } = pageResult<InvoiceDto>(response))
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load member invoices", error)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Addressed to {member.fullName} personally. Company invoices live on the company page.
          </p>
        </div>
        <AddInvoiceButton defaultMemberId={member.id} />
      </div>
      <InvoiceTable
        data={results}
        totalCount={total}
        memberNames={{ [member.id]: member.fullName }}
        activeStatus={status}
        hideCustomer
      />
    </div>
  )
}
