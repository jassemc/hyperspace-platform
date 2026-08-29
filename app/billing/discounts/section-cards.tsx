import { getListDiscounts } from "@/lib/service"
import type { DiscountDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BadgePercentIcon, LayersIcon, DollarSignIcon, TicketIcon } from "lucide-react"
import { isInWindow } from "./discount-meta"

type DiscountsPage = {
  results?: DiscountDto[]
  meta?: { totalItems?: number }
}

type DiscountStats = {
  totalActive: number
  planDiscounts: number
  rateDiscounts: number
  promosInWindow: number
}

async function loadDiscountStats(): Promise<DiscountStats> {
  try {
    const response = (await getListDiscounts({
      limit: 1000,
      offset: 0,
      sort: "ASC",
    })) as DiscountsPage

    const discounts = response.results ?? []
    const active = discounts.filter((discount) => discount.status === "active")

    return {
      totalActive: active.length,
      planDiscounts: active.filter((discount) => discount.kind === "plan").length,
      rateDiscounts: active.filter((discount) => discount.kind === "resource_rate").length,
      promosInWindow: active.filter((discount) => discount.kind === "promo" && isInWindow(discount)).length,
    }
  } catch (error) {
    console.warn("Failed to load discount stats", error)
    return { totalActive: 0, planDiscounts: 0, rateDiscounts: 0, promosInWindow: 0 }
  }
}

export async function SectionCards() {
  const stats = await loadDiscountStats()

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total active</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.totalActive}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <BadgePercentIcon className="size-3" />
              Discounts
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Discounts that can currently be assigned</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Plan discounts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.planDiscounts}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <LayersIcon className="size-3" />
              Plans
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Reduce a membership&apos;s cycle fee</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Rate discounts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.rateDiscounts}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <DollarSignIcon className="size-3" />
              Rates
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Attached to billing plans</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Promo codes (in window)</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.promosInWindow}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TicketIcon className="size-3" />
              Promo
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Live on the public website right now</div>
        </CardFooter>
      </Card>
    </div>
  )
}
