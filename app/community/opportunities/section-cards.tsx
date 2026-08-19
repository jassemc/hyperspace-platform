import { getListOpportunities } from "@/lib/service"
import type { OpportunityDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { apiNumber } from "@/lib/api-value"
import { StatCards } from "@/components/stat-cards"
import { formatPriceHt } from "@/lib/format"
import { TargetIcon, TrophyIcon, CoinsIcon, DoorClosedIcon } from "lucide-react"

export async function SectionCards() {
  let opportunities: OpportunityDto[] = []
  let total = 0

  try {
    const response = await getListOpportunities({ limit: 100, offset: 0, sort: "DESC" })
    const page = pageResult<OpportunityDto>(response)
    opportunities = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load opportunity stats", error)
  }

  const open = opportunities.filter(
    (opportunity) => opportunity.stage !== "won" && opportunity.stage !== "lost"
  )
  const pipeline = open.reduce(
    (sum, opportunity) => sum + (apiNumber(opportunity.expectedValue) ?? 0),
    0
  )

  return (
    <StatCards
      cards={[
        { label: "Total opportunities", value: total, badge: "All", icon: TargetIcon, footer: "Every lead on record" },
        { label: "Open", value: open.length, badge: "Active", icon: DoorClosedIcon, footer: "Not yet won or lost" },
        { label: "Pipeline", value: formatPriceHt(pipeline), badge: "Expected", icon: CoinsIcon, footer: "Expected value still open" },
        { label: "Won", value: opportunities.filter((o) => o.stage === "won").length, badge: "Closed", icon: TrophyIcon, footer: "Converted to members" },
      ]}
    />
  )
}
