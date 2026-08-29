import type { CompanyStatsDto } from "@/lib/service/HsService"
import { changeIn } from "@/lib/stats"

/**
 * Pure: safe to import from client components. The fetcher lives in
 * ./stats.ts, whose cache helper reaches next/headers and must stay on
 * the server.
 */
/** Card counts, with `undefined` meaning "unknown" rather than "zero". */
export function companyTotals(stats: CompanyStatsDto | null) {
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  const weeks = stats?.byWeek ?? []

  return {
    weeks,
    changeIn: (key: "created") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    total: stats?.total,
    withMembers: stats?.withMembers,
  }
}
