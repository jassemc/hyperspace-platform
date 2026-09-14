import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListInvoices } from "@/lib/service"
import type { InvoiceDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { formatPriceHt } from "@/lib/format"
import { FileTextIcon, CoinsIcon, AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"

export async function SectionCards() {
  let invoices: InvoiceDto[] = []
  let total = 0

  try {
    const response = await getListInvoices({ limit: 100, offset: 0, sort: "DESC" })
    const page = pageResult<InvoiceDto>(response)
    invoices = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load invoice stats", error)
  }

  const live = invoices.filter((invoice) => invoice.status !== "void")
  const billed = live.reduce((sum, invoice) => sum + invoice.totalTtc, 0)
  const outstanding = live.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.totalTtc - invoice.paid),
    0
  )

  return (
    <StatCards
      cards={[
        { label: "Total invoices", value: total, badge: "All", icon: FileTextIcon, footer: "Issued to members and companies" },
        { label: "Billed", value: formatPriceHt(billed), badge: "TTC", icon: CoinsIcon, footer: "Excluding voided invoices" },
        { label: "Outstanding", value: formatPriceHt(outstanding), badge: "Unpaid", icon: AlertTriangleIcon, footer: "Still to be collected" },
        { label: "Paid", value: live.filter((invoice) => invoice.status === "paid").length, badge: "Settled", icon: CheckCircle2Icon, footer: "Fully settled invoices" },
      ]}
    />
  )
}
