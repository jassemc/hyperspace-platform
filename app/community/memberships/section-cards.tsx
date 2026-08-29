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
  const thisWeek = totals.weeks.at(-1)
  const filtered = Boolean(q || planId)

  return (
    <StatCards
      cards={[
        {
          // The series plots what the figure counts: memberships created, by week.
          label: "New memberships",
          value: figure(thisWeek?.created),
          unit: "this week",
          icon: BadgeCheckIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels(totals.weeks),
          footer: filtered
            ? `${figure(totals.total)} matching the current filters`
            : `${figure(totals.total)} memberships in total`,
        },
        {
          label: "Active",
          value: figure(totals.countFor("active")),
          badge: "Live",
          icon: BadgeCheckIcon,
          footer: totals.topPlan ? `Most held: ${totals.topPlan.name}` : "Currently running",
        },
        {
          // The headline is what is queued; the trend behind it is when
          // terms actually begin, week by week — including weeks ahead,
          // since a pending start sits in the future by definition.
          label: "Pending",
          value: figure(totals.countFor("pending")),
          badge: "Upcoming",
          icon: ClockIcon,
          delta: totals.changeIn("starting"),
          series: totals.weeks.map((entry) => entry.starting),
          seriesLabels: weekLabels(totals.weeks),
          footer:
            thisWeek === undefined
              ? "Starting in the future"
              : thisWeek.starting === 0
                ? "No term starts this week"
                : `${thisWeek.starting} term${thisWeek.starting === 1 ? "" : "s"} starting this week`,
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
