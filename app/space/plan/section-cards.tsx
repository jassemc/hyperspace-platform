import { getListPlans } from "@/lib/service"
import type { PlanDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Layers3Icon, Repeat2Icon, CircleCheckBigIcon, ArchiveIcon } from "lucide-react"

type PlansPage = {
  results?: PlanDto[]
  meta?: { totalItems?: number }
}

type PlanStats = {
  total: number
  recurring: number
  active: number
  archived: number
}

async function loadPlanStats(): Promise<PlanStats> {
  try {
    const response = (await getListPlans({
      limit: 100,
      offset: 0,
      sort: "ASC",
    })) as PlansPage

    const plans = response.results ?? []
    const total = response.meta?.totalItems ?? plans.length

    return {
      total,
      recurring: plans.filter((plan) => plan.kind === "recurring").length,
      active: plans.filter((plan) => plan.status === "active").length,
      archived: plans.filter((plan) => plan.status === "archived").length,
    }
  } catch (error) {
    console.warn("Failed to load plan stats", error)
    return { total: 0, recurring: 0, active: 0, archived: 0 }
  }
}

export async function SectionCards() {
  const stats = await loadPlanStats()

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total plans</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.total}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Layers3Icon className="size-3" />
              Catalog
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Plans available in your catalog</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Recurring</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.recurring}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Repeat2Icon className="size-3" />
              Cycles
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Plans billed on a recurring basis</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Active</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.active}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <CircleCheckBigIcon className="size-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Currently enabled for sales</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Archived</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.archived}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <ArchiveIcon className="size-3" />
              History
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Plans kept for historical references</div>
        </CardFooter>
      </Card>
    </div>
  )
}
