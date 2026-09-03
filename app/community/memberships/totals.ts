import type { MembershipStatsDto } from "@/lib/service/HsService"
import { changeIn } from "@/lib/stats"

/**
 * Pure: safe to import from client components. The fetcher lives in
 * ./stats.ts, whose cache helper reaches next/headers and must stay on
 * the server.
 */
/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function membershipTotals(stats: MembershipStatsDto | null) {
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  const weeks = stats?.byWeek ?? []
  const plans = stats?.byPlan ?? []

  return {
    weeks,
    changeIn: (key: "created" | "starting") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    total: stats?.total,
    topPlan: stats?.byPlan[0],
    plans,
  }
}
