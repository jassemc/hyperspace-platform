import { StatCards } from "@/components/stat-cards"
import { opportunityTotals } from "./opportunity-meta"
import { opportunityStats } from "./stats"
import { formatPriceHt } from "@/lib/format"
import { CoinsIcon, SparklesIcon, TrophyIcon, UsersIcon } from "lucide-react"
import { OPPORTUNITY_STAGE_LABELS } from "./opportunity-meta"

export async function SectionCards() {
  // Counted by the database, and shared with the tab strip when neither is
  // filtered — counting a page of rows here understated every figure past the
  // hundredth lead.
  const stats = await opportunityStats(undefined, undefined)

  const totals = opportunityTotals(stats)

  const weekLabels = totals.weeks.map((entry) =>
    new Date(entry.week).toLocaleDateString(undefined, { day: "numeric", month: "short" })
  )

  return (
    <StatCards
      cards={[
        {
          // The snapshot: what is in play right now, wherever it came from.
          label: "Open leads",
          value: totals.open,
          unit: "open",
          badge: `${totals.total} all time`,
          icon: UsersIcon,
          footer: totals.busiestOpen
            ? `Most sit in ${OPPORTUNITY_STAGE_LABELS[totals.busiestOpen.stage]} (${totals.busiestOpen.count})`
            : "Nothing open right now",
        },
        {
          // The series plots what the figure counts: leads opened, by week.
          label: "New leads",
          value: totals.weeks.at(-1)?.created ?? 0,
          unit: "this week",
          icon: SparklesIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels,
          footer: "Opened over the last eight weeks",
        },
        {
          label: "Won",
          value: totals.weeks.at(-1)?.won ?? 0,
          unit: "this week",
          icon: TrophyIcon,
          delta: totals.changeIn("won"),
          series: totals.weeks.map((entry) => entry.won),
          seriesLabels: weekLabels,
          footer:
            totals.winRate === null
              ? "No lead closed yet"
              : `${totals.winRate}% win rate — ${totals.won} won, ${totals.lost} lost`,
        },
        {
          label: "Pipeline",
          value: formatPriceHt(totals.pipelineHt),
          badge: `${totals.engaged} in tour or quote`,
          icon: CoinsIcon,
          footer: `Expected value across ${totals.open} open lead${totals.open === 1 ? "" : "s"}`,
        },
      ]}
    />
  )
}
