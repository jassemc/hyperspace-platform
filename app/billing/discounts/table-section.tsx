import { getListDiscounts, getListPlans, getListResourceRates } from "@/lib/service"
import type {
  DiscountDto,
  DiscountKind,
  DiscountStatus,
  ListDiscountsParams,
  PlanDto,
  ResourceRateDto,
} from "@/lib/service/HsService"
import { DiscountTable } from "./discount-table"

type DiscountsPage = { results?: DiscountDto[]; meta?: { totalItems?: number } }

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function DiscountTableSection({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}>) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams

  const page = Number(firstParam(resolvedSearchParams?.page)) || 1
  const pageSize = Number(firstParam(resolvedSearchParams?.pageSize)) || 10
  const kind = firstParam(resolvedSearchParams?.kind) as DiscountKind | undefined
  const status = firstParam(resolvedSearchParams?.status) as DiscountStatus | undefined

  const query: ListDiscountsParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    kind: kind || undefined,
    status: status || undefined,
  }

  let results: DiscountDto[] = []
  let total = 0

  try {
    const response = (await getListDiscounts(query)) as DiscountsPage
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
  } catch (error) {
    console.warn("Failed to load discounts", error)
  }

  // Discounts carry only ids, so resolve plan and rate names for the table.
  const planNames: Record<string, string> = {}
  try {
    const plansResponse = await getListPlans({ limit: 100, offset: 0, sort: "ASC" })
    for (const plan of (plansResponse?.results ?? []) as PlanDto[]) {
      planNames[plan.id] = plan.name
    }
  } catch (error) {
    console.warn("Failed to load plans", error)
  }

  const rateNames: Record<string, string> = {}
  try {
    const ratesResponse = await getListResourceRates({ limit: 200, offset: 0, sort: "ASC" })
    for (const rate of (ratesResponse?.results ?? []) as ResourceRateDto[]) {
      rateNames[rate.id] = rate.name
    }
  } catch (error) {
    console.warn("Failed to load resource rates", error)
  }

  return (
    <DiscountTable
      data={results}
      totalCount={total}
      planNames={planNames}
      rateNames={rateNames}
      activeKind={kind}
      activeStatus={status}
    />
  )
}
