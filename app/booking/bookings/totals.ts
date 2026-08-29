import type { BookingStatsDto } from "@/lib/service/HsService"
import { changeIn } from "@/lib/stats"

/**
 * Pure: safe to import from client components. The fetcher lives in
 * ./stats.ts, whose cache helper reaches next/headers and must stay on
 * the server.
 */
/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function bookingTotals(stats: BookingStatsDto | null) {
  const rows = stats?.byStatus ?? []
  const byStatus = new Map<string, number>(rows.map((row) => [row.status, row.count]))
  const valueByStatus = new Map<string, number>(rows.map((row) => [row.status, row.valueHt]))
  const weeks = stats?.byWeek ?? []
  const busiest = (stats?.byResource ?? [])[0]

  return {
    weeks,
    changeIn: (key: "created" | "starting") => changeIn(weeks, key),
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    valueFor: (status: string) => valueByStatus.get(status) ?? 0,
    total: stats?.total,
    busiestResource: busiest ? { name: busiest.name, count: busiest.count } : null,
  }
}
