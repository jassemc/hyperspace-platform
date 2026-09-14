import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListExtras } from "@/lib/service"
import type { ExtraDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { formatPriceHt } from "@/lib/format"
import { PackageIcon, CoinsIcon, LinkIcon, WalletIcon } from "lucide-react"

export async function SectionCards() {
  let extras: ExtraDto[] = []
  let total = 0

  try {
    const response = await getListExtras({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<ExtraDto>(response)
    extras = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load extra stats", error)
  }

  const averagePrice = extras.length
    ? extras.reduce((sum, extra) => sum + extra.priceHt, 0) / extras.length
    : 0

  return (
    <StatCards
      cards={[
        { label: "Total extras", value: total, badge: "Add-ons", icon: PackageIcon, footer: "Sellable alongside plans and rates" },
        { label: "Average price", value: formatPriceHt(averagePrice), badge: "HT", icon: CoinsIcon, footer: "Mean price excluding VAT" },
        { label: "With a deposit", value: extras.filter((extra) => extra.deposit > 0).length, badge: "Deposit", icon: WalletIcon, footer: "Extras requiring a deposit" },
        { label: "Linked to amenity", value: extras.filter((extra) => Boolean(extra.amenityId)).length, badge: "Linked", icon: LinkIcon, footer: "Share an amenity name and icon" },
      ]}
    />
  )
}
