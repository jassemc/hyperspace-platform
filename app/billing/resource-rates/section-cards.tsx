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
import { DollarSignIcon, CalendarDaysIcon, LayersIcon, Clock3Icon } from "lucide-react"

type ResourceRatesPage = {
  results?: ResourceRateDto[]
  meta?: { totalItems?: number }
}

type ResourceRateStats = {
  total: number
  weekend: number
  typesPriced: number
  withExtras: number
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
      weekend: rates.filter((rate) => rate.isWeekendRate).length,
      typesPriced: new Set(rates.map((rate) => rate.resourceTypeId)).size,
      withExtras: rates.filter((rate) => (rate.extras ?? []).length > 0).length,
    }
  } catch (error) {
    console.warn("Failed to load resource rate stats", error)
    return { total: 0, weekend: 0, typesPriced: 0, withExtras: 0 }
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
          <CardDescription>Weekend variants</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.weekend}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <CalendarDaysIcon className="size-3" />
              Weekend
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Saturday and Sunday overrides</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Types priced</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.typesPriced}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <LayersIcon className="size-3" />
              Coverage
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Distinct resource types with a rate</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>With extras</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.withExtras}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Clock3Icon className="size-3" />
              Add-ons
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Rates offering add-ons</div>
        </CardFooter>
      </Card>
    </div>
  )
}
