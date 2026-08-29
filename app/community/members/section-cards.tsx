import { StatCards } from "@/components/stat-cards"
import { UsersIcon, UserCheckIcon, UserPlusIcon, Building2Icon } from "lucide-react"
import { resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { weekLabels } from "@/lib/stats"
import { memberStats, memberStatsArgs, memberTotals } from "./stats"

export async function SectionCards({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  // Same helper the table uses: cache() keys primitive arguments by value,
  // so this dedupes into a single request only because both call sites
  // derive `q`/`kindHint` from the URL the exact same way.
  const { q, kindHint } = memberStatsArgs(params)
  const stats = await memberStats(q, kindHint, undefined)

  const totals = memberTotals(stats)
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Total members",
          value: figure(totals.total),
          badge: "All",
          icon: UsersIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels(totals.weeks),
          footer: "Added over the last eight weeks",
        },
        {
          label: "Active",
          value: figure(totals.countFor("active")),
          badge: "Community",
          icon: UserCheckIcon,
          footer: "Currently active members",
        },
        {
          label: "Leads",
          value: figure(totals.countFor("lead")),
          badge: "Pipeline",
          icon: UserPlusIcon,
          footer: "Flagged as leads",
        },
        {
          label: "With employer",
          value: figure(totals.withCompany),
          badge: "Companies",
          icon: Building2Icon,
          footer: "Attached to a company",
        },
      ]}
    />
  )
}
