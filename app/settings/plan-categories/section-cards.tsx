import { getListPlanCategories, getListPlans } from "@/lib/service"
import type { PlanCategoryDto, PlanDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { LayoutGridIcon, LockIcon, PlusIcon, HelpCircleIcon } from "lucide-react"

export async function SectionCards() {
  let categories: PlanCategoryDto[] = []
  let total = 0
  let plans: PlanDto[] = []

  try {
    const [categoryPage, planPage] = await Promise.all([
      getListPlanCategories({ limit: 100, offset: 0, sort: "ASC" }),
      getListPlans({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
    ])
    const page = pageResult<PlanCategoryDto>(categoryPage)
    categories = page.results
    total = page.total
    if (planPage) plans = pageResult<PlanDto>(planPage).results
  } catch (error) {
    console.warn("Failed to load plan category stats", error)
  }

  const shipped = categories.filter((category) => category.isDefault).length
  const uncategorised = plans.filter((plan) => !plan.categoryId).length

  return (
    <StatCards
      cards={[
        { label: "Categories", value: total, badge: "Sections", icon: LayoutGridIcon, footer: "Website service sections" },
        { label: "Shipped defaults", value: shipped, badge: "Built-in", icon: LockIcon, footer: "Created by migrations" },
        { label: "Staff-created", value: Math.max(0, categories.length - shipped), badge: "Custom", icon: PlusIcon, footer: "Added without a code change" },
        { label: "Uncategorised plans", value: uncategorised, badge: "To sort", icon: HelpCircleIcon, footer: "Plans with no category set" },
      ]}
    />
  )
}
