import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListCharges } from "@/lib/service"
import type { ChargeDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { apiString } from "@/lib/api-value"
import { StatCards } from "@/components/stat-cards"
import { formatPriceHt } from "@/lib/format"
import { ReceiptIcon, CoinsIcon, FileClockIcon, FileCheckIcon } from "lucide-react"

export async function SectionCards() {
  let charges: ChargeDto[] = []
  let total = 0

  try {
    const response = await getListCharges({ limit: 100, offset: 0, sort: "DESC" })
    const page = pageResult<ChargeDto>(response)
    charges = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load charge stats", error)
  }

  const uninvoiced = charges.filter((charge) => !apiString(charge.invoiceId))
  const uninvoicedValue = uninvoiced.reduce((sum, charge) => sum + charge.amountHt, 0)

  return (
    <StatCards
      cards={[
        { label: "Total charges", value: total, badge: "All", icon: ReceiptIcon, footer: "Billable lines raised" },
        { label: "Uninvoiced", value: uninvoiced.length, badge: "Pending", icon: FileClockIcon, footer: "Not yet on an invoice" },
        { label: "Uninvoiced value", value: formatPriceHt(uninvoicedValue), badge: "HT", icon: CoinsIcon, footer: "Ready to be invoiced" },
        { label: "Invoiced", value: charges.length - uninvoiced.length, badge: "Billed", icon: FileCheckIcon, footer: "Already on an invoice" },
      ]}
    />
  )
}
