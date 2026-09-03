import type { MemberStatsDto } from "@/lib/service/HsService"
import { changeIn } from "@/lib/stats"

/**
 * Pure: safe to import from client components. The fetcher lives in
 * ./stats.ts, whose cache helper reaches next/headers and must stay on
 * the server.
 */
/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function memberTotals(stats: MemberStatsDto | null) {
  const byStatus = new Map<string, number>(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  const byKind = new Map<string, number>(
    (stats?.byKindHint ?? []).map((row) => [row.kindHint, row.count])
  )
  const weeks = stats?.byWeek ?? []

  return {
    weeks,
    changeIn: (key: "created" | "joined") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    kindCount: (kind: string) => (stats ? (byKind.get(kind) ?? 0) : undefined),
    total: stats?.total,
    withCompany: stats?.withCompany,
  }
}
