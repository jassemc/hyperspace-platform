import { getAnalyticsRevenue } from "@/lib/service"
import type { RevenueBucketDto } from "@/lib/service/HsService"
import { resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { formatPriceHt } from "@/lib/format"
import { readDateRange } from "./date-range"
import { SummaryTable } from "@/components/summary-table"

export async function RevenueSection({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { from, to } = readDateRange(params)

  let buckets: RevenueBucketDto[] = []
  let error: string | null = null

  try {
    const response = await getAnalyticsRevenue({ from, to, groupBy: "month" })
    // The endpoint is documented as a single bucket shape but returns a series.
    buckets = (Array.isArray(response) ? response : [response]) as RevenueBucketDto[]
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Failed to load revenue"
  }

  const totalTtc = buckets.reduce((sum, bucket) => sum + (bucket?.totalTtc ?? 0), 0)

  return (
    <SummaryTable
      title="Revenue"
      subtitle={`${from} to ${to} · ${formatPriceHt(totalTtc)} TTC`}
      error={error}
      emptyMessage="No revenue in this window."
      headers={["Bucket", "HT", "VAT", "TTC", "Charges"]}
      rows={buckets.map((bucket) => [
        bucket?.bucket ?? "-",
        formatPriceHt(bucket?.totalHt),
        formatPriceHt(bucket?.totalVat),
        formatPriceHt(bucket?.totalTtc),
        String(bucket?.chargeCount ?? 0),
      ])}
    />
  )
}
