import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListPlans } from "@/lib/service"
import type { ListPlansParams, PlanDto } from "@/lib/service/HsService"
import { PlanTable } from "./plan-table"

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function PlanTableSection({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}>) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams

  const page = Number(firstParam(resolvedSearchParams?.page)) || 1
  const pageSize = Number(firstParam(resolvedSearchParams?.pageSize)) || 10
  const searchQuery = firstParam(resolvedSearchParams?.name)

  const query: ListPlansParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
  }

  let results: PlanDto[] = []
  let total = 0

  try {
    const response = (await getListPlans(query)) as unknown as { results?: PlanDto[]; meta?: { totalItems?: number } }
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load plans", error)
  }

  return <PlanTable data={results} totalCount={total} />
}
