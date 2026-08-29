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
  const { q, kindHint, createdFrom, createdTo } = memberStatsArgs(params)
  const stats = await memberStats(q, kindHint, undefined, createdFrom, createdTo)

  const totals = memberTotals(stats)
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)
  const thisWeek = totals.weeks.at(-1)
  const filtered = Boolean(q || kindHint || createdFrom || createdTo)
  const withCompanyShare =
    totals.total && totals.withCompany !== undefined
      ? Math.round((totals.withCompany / totals.total) * 100)
      : undefined

  return (
    <StatCards
      cards={[
        {
          // The series plots what the figure counts: members added, by week.
          label: "New members",
          value: figure(thisWeek?.created),
          unit: "this week",
          icon: UsersIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels(totals.weeks),
          footer: filtered
            ? `${figure(totals.total)} matching the current filters`
            : `${figure(totals.total)} members in total`,
        },
        {
          // The headline is the snapshot; the trend behind it is the week
          // each member's first own membership started — when a lead
          // became one of these.
          label: "Active",
          value: figure(totals.countFor("active")),
          badge: "Community",
          icon: UserCheckIcon,
          delta: totals.changeIn("joined"),
          series: totals.weeks.map((entry) => entry.joined),
          seriesLabels: weekLabels(totals.weeks),
          footer:
            thisWeek === undefined
              ? "Currently active members"
              : thisWeek.joined === 0
                ? "Nobody joined this week"
                : `${thisWeek.joined} joined this week`,
        },
        {
          label: "Leads",
          value: figure(totals.countFor("lead")),
          badge: "Pipeline",
          icon: UserPlusIcon,
          footer: "Open opportunity, nothing consumed yet",
        },
        {
          label: "With employer",
          value: figure(totals.withCompany),
          badge: "Companies",
          icon: Building2Icon,
          footer:
            withCompanyShare === undefined
              ? "Attached to a company"
              : `${withCompanyShare}% of all members`,
        },
      ]}
    />
  )
}
