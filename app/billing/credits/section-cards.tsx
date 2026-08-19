import { getListCredits } from "@/lib/service"
import type { CreditTransactionDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { TicketIcon, PlusCircleIcon, MinusCircleIcon, HourglassIcon } from "lucide-react"

export async function SectionCards() {
  let credits: CreditTransactionDto[] = []
  let total = 0

  try {
    const response = await getListCredits({ limit: 100, offset: 0, sort: "DESC" })
    const page = pageResult<CreditTransactionDto>(response)
    credits = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load credit stats", error)
  }

  // Grants carry a positive delta, consumption a negative one.
  const granted = credits.filter((credit) => credit.delta >= 0).reduce((sum, c) => sum + c.delta, 0)
  const consumed = credits.filter((credit) => credit.delta < 0).reduce((sum, c) => sum - c.delta, 0)
  const expiring = credits.filter(
    (credit) => credit.expiresAt && new Date(credit.expiresAt).getTime() > Date.now()
  ).length

  return (
    <StatCards
      cards={[
        { label: "Transactions", value: total, badge: "All", icon: TicketIcon, footer: "Grants and consumption" },
        { label: "Granted", value: granted, badge: "In", icon: PlusCircleIcon, footer: "Credits issued" },
        { label: "Consumed", value: consumed, badge: "Out", icon: MinusCircleIcon, footer: "Credits spent" },
        { label: "With an expiry", value: expiring, badge: "Dated", icon: HourglassIcon, footer: "Grants that will lapse" },
      ]}
    />
  )
}
