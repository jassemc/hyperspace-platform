import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListPlans } from "@/lib/service"
import type { PlanDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { Layers3Icon, Repeat2Icon, CircleCheckBigIcon, ArchiveIcon } from "lucide-react"

export async function SectionCards() {
  let plans: PlanDto[] = []
  let total = 0

  try {
    const response = await getListPlans({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<PlanDto>(response)
    plans = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load plan stats", error)
  }

  return (
    <StatCards
      cards={[
        { label: "Total plans", value: total, badge: "Catalog", icon: Layers3Icon, footer: "Plans available in your catalog" },
        { label: "Recurring", value: plans.filter((plan) => plan.kind === "recurring").length, badge: "Cycles", icon: Repeat2Icon, footer: "Plans billed on a recurring basis" },
        { label: "Active", value: plans.filter((plan) => plan.status === "active").length, badge: "Live", icon: CircleCheckBigIcon, footer: "Currently enabled for sales" },
        { label: "Archived", value: plans.filter((plan) => plan.status === "archived").length, badge: "History", icon: ArchiveIcon, footer: "Plans kept for historical references" },
      ]}
    />
  )
}
