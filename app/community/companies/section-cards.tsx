import { StatCards } from "@/components/stat-cards"
import { Building2Icon, BadgeCheckIcon, UserPlusIcon, UsersIcon } from "lucide-react"
import { resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { weekLabels } from "@/lib/stats"
import { companyStats, companyStatsArgs, companyTotals } from "./stats"

export async function SectionCards({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  // Same helper the table uses: cache() keys primitive arguments by value,
  // so this dedupes into a single request only because both call sites
  // derive `q` from the URL the exact same way.
  const { q } = companyStatsArgs(params)
  const stats = await companyStats(q)

  const totals = companyTotals(stats)
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Companies",
          value: figure(totals.total),
          badge: "All",
          icon: Building2Icon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels(totals.weeks),
          footer: "Added over the last eight weeks",
        },
        {
          label: "Active",
          value: figure(totals.countFor("active")),
          badge: "Community",
          icon: BadgeCheckIcon,
          footer: "Currently active companies",
        },
        {
          label: "Leads",
          value: figure(totals.countFor("lead")),
          badge: "Pipeline",
          icon: UserPlusIcon,
          footer: "Flagged as leads",
        },
        {
          label: "With members",
          value: figure(totals.withMembers),
          badge: "Community",
          icon: UsersIcon,
          footer: "Have at least one member",
        },
      ]}
    />
  )
}
