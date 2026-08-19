import { getAnalyticsMemberships } from "@/lib/service"
import type { MembershipAnalyticsDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { SummaryTable } from "@/components/summary-table"

export async function MembershipSection() {
  let analytics: MembershipAnalyticsDto | null = null
  let error: string | null = null

  try {
    analytics = (await getAnalyticsMemberships({ expiringWithinDays: 30 })) as MembershipAnalyticsDto
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Failed to load membership analytics"
  }

  const activeByPlan = analytics?.activeByPlan ?? []
  const expiring = analytics?.expiring ?? []
  const churn = analytics?.churnByCohort ?? []

  return (
    <div className="space-y-8">
      <SummaryTable
        title="Active memberships by plan"
        error={error}
        emptyMessage="No active memberships."
        headers={["Plan", "Active"]}
        rows={activeByPlan.map((row) => [row.planName, String(row.activeCount)])}
      />

      <SummaryTable
        title="Expiring within 30 days"
        error={error}
        emptyMessage="Nothing expiring in the next 30 days."
        headers={["Plan", "Ends"]}
        rows={expiring.map((row) => [row.planName, formatDate(row.endsAt)])}
      />

      <SummaryTable
        title="Churn by cohort"
        error={error}
        emptyMessage="No cohort data yet."
        headers={["Cohort", "Started", "Ended", "Churn"]}
        rows={churn.map((row) => [
          row.cohort,
          String(row.started),
          String(row.ended),
          `${Math.round(row.churnRate * 100)}%`,
        ])}
      />
    </div>
  )
}
