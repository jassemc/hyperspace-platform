import { getAnalyticsOccupancy } from "@/lib/service"
import type { OccupancyBucketDto } from "@/lib/service/HsService"
import { resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { readDateRange } from "./date-range"
import { SummaryTable } from "@/components/summary-table"

function formatRate(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "-"
  // The API expresses the rate as a fraction of capacity.
  return `${Math.round(value * 100)}%`
}

export async function OccupancySection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { from, to } = readDateRange(params)

  let buckets: OccupancyBucketDto[] = []
  let error: string | null = null

  try {
    const response = await getAnalyticsOccupancy({ from, to, granularity: "day" })
    buckets = (Array.isArray(response) ? response : [response]) as OccupancyBucketDto[]
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Failed to load occupancy"
  }

  const peak = buckets.reduce((max, bucket) => Math.max(max, bucket?.occupancyRate ?? 0), 0)

  return (
    <SummaryTable
      title="Occupancy"
      subtitle={`${from} to ${to} · peak ${formatRate(peak)}`}
      error={error}
      emptyMessage="No occupancy recorded in this window."
      headers={["Bucket", "Concurrent", "Capacity", "Rate", "Check-ins"]}
      rows={buckets.map((bucket) => [
        bucket?.bucket ?? "-",
        String(bucket?.concurrent ?? 0),
        String(bucket?.capacity ?? 0),
        formatRate(bucket?.occupancyRate),
        String(bucket?.totalCheckins ?? 0),
      ])}
    />
  )
}
