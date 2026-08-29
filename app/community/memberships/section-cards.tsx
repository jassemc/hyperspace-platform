import { StatCards } from "@/components/stat-cards"
import { BadgeCheckIcon, ClockIcon, XCircleIcon } from "lucide-react"
import { resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { weekLabels } from "@/lib/stats"
import { membershipStats, membershipStatsArgs, membershipTotals } from "./stats"

export async function SectionCards({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  // Same helper the table uses: cache() keys primitive arguments by value,
  // so this dedupes into a single request only because both call sites
  // derive `q`/`planId` from the URL the exact same way.
  const { q, planId } = membershipStatsArgs(params)
  const stats = await membershipStats(q, planId, undefined, undefined)

  const totals = membershipTotals(stats)
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Total memberships",
          value: figure(totals.total),
          badge: "All",
          icon: BadgeCheckIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels(totals.weeks),
          footer: totals.topPlan ? `Most held: ${totals.topPlan.name}` : "Every membership on record",
        },
        {
          label: "Active",
          value: figure(totals.countFor("active")),
          badge: "Live",
          icon: BadgeCheckIcon,
          footer: "Currently running",
        },
        {
          label: "Pending",
          value: figure(totals.countFor("pending")),
          badge: "Upcoming",
          icon: ClockIcon,
          footer: "Starting in the future",
        },
        {
          label: "Ended",
          value: figure(totals.countFor("ended")),
          badge: "Closed",
          icon: XCircleIcon,
          footer: "Past their end date",
        },
      ]}
    />
  )
}
