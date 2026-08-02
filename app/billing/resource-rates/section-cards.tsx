import { getListResourceRates } from "@/lib/service"
import type { ResourceRateDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSignIcon, UsersIcon, EyeIcon, Clock3Icon } from "lucide-react"

type ResourceRatesPage = {
  results?: ResourceRateDto[]
  meta?: { totalItems?: number }
}

type ResourceRateStats = {
  total: number
  members: number
  visitors: number
  hourly: number
}

async function loadResourceRateStats(): Promise<ResourceRateStats> {
  try {
    const response = (await getListResourceRates({
      limit: 1000,
      offset: 0,
      sort: "ASC",
    })) as ResourceRatesPage

    const rates = response.results ?? []
    const total = response.meta?.totalItems ?? rates.length

    return {
      total,
      members: rates.filter((rate) => rate.audience === "member").length,
      visitors: rates.filter((rate) => rate.audience === "visitor").length,
      hourly: rates.filter((rate) => rate.rateType === "hourly").length,
    }
  } catch (error) {
    console.warn("Failed to load resource rate stats", error)
    return { total: 0, members: 0, visitors: 0, hourly: 0 }
  }
}

export async function SectionCards() {
  const stats = await loadResourceRateStats()

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total rates</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.total}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <DollarSignIcon className="size-3" />
              Pricing
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Configured pricing entries</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Member rates</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.members}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UsersIcon className="size-3" />
              Members
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Rates for member audiences</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Visitor rates</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.visitors}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <EyeIcon className="size-3" />
              Visitors
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Rates for visitor audiences</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Hourly</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.hourly}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Clock3Icon className="size-3" />
              Time-based
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Hourly billing entries</div>
        </CardFooter>
      </Card>
    </div>
  )
}
