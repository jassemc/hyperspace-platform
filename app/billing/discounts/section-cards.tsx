import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListDiscounts } from "@/lib/service"
import type { DiscountDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { BadgePercentIcon, LayersIcon, DollarSignIcon, GlobeIcon } from "lucide-react"
import { isInWindow } from "./discount-meta"

export async function SectionCards() {
  let discounts: DiscountDto[] = []

  try {
    const response = await getListDiscounts({ limit: 100, offset: 0, sort: "ASC" })
    discounts = pageResult<DiscountDto>(response).results
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load discount stats", error)
  }

  const active = discounts.filter((discount) => discount.status === "active")

  return (
    <StatCards
      cards={[
        { label: "Total active", value: active.length, badge: "Discounts", icon: BadgePercentIcon, footer: "Discounts that can currently be assigned" },
        { label: "Plan discounts", value: active.filter((discount) => discount.kind === "plan").length, badge: "Plans", icon: LayersIcon, footer: "Reduce a membership's cycle fee" },
        { label: "Rate discounts", value: active.filter((discount) => discount.kind === "resource_rate").length, badge: "Rates", icon: DollarSignIcon, footer: "Attached to billing plans" },
        { label: "Live on the website", value: active.filter((discount) => discount.isPublic && isInWindow(discount)).length, badge: "Public", icon: GlobeIcon, footer: "Public, active, and in their validity window" },
      ]}
    />
  )
}
