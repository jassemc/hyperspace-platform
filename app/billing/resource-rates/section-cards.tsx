import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListResourceRates } from "@/lib/service"
import type { ResourceRateDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { DollarSignIcon, CalendarDaysIcon, LayersIcon, Clock3Icon } from "lucide-react"

export async function SectionCards() {
  let rates: ResourceRateDto[] = []
  let total = 0

  try {
    const response = await getListResourceRates({ limit: 1000, offset: 0, sort: "ASC" })
    const page = pageResult<ResourceRateDto>(response)
    rates = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load resource rate stats", error)
  }

  return (
    <StatCards
      cards={[
        { label: "Total rates", value: total, badge: "Pricing", icon: DollarSignIcon, footer: "Configured pricing entries" },
        { label: "Weekend variants", value: rates.filter((rate) => rate.isWeekendRate).length, badge: "Weekend", icon: CalendarDaysIcon, footer: "Saturday and Sunday overrides" },
        { label: "Types priced", value: new Set(rates.map((rate) => rate.resourceTypeId)).size, badge: "Coverage", icon: LayersIcon, footer: "Distinct resource types with a rate" },
        { label: "With extras", value: rates.filter((rate) => (rate.extras ?? []).length > 0).length, badge: "Add-ons", icon: Clock3Icon, footer: "Rates offering add-ons" },
      ]}
    />
  )
}
