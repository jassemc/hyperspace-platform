import { getListResourceRates, getListResourceTypes } from "@/lib/service"
import type {
  ListResourceRatesParams,
  ResourceRateDto,
  ResourceTypeDto,
} from "@/lib/service/HsService"
import { ResourceRateTable } from "./resource-rate-table"

type ResourceRatesPage = { results?: ResourceRateDto[]; meta?: { totalItems?: number } }

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function ResourceRateTableSection({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}>) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams

  const page = Number(firstParam(resolvedSearchParams?.page)) || 1
  const pageSize = Number(firstParam(resolvedSearchParams?.pageSize)) || 10
  const searchQuery = firstParam(resolvedSearchParams?.name)
  const resourceTypeId = firstParam(resolvedSearchParams?.resourceTypeId)

  const query: ListResourceRatesParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
    resourceTypeId: resourceTypeId || undefined,
  }

  let results: ResourceRateDto[] = []
  let total = 0

  try {
    const response = (await getListResourceRates(query)) as ResourceRatesPage
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
  } catch (error) {
    console.warn("Failed to load resource rates", error)
  }

  // Rates carry only `resourceTypeId`, so resolve the type names for the table.
  const resourceTypeNames: Record<string, string> = {}
  try {
    const typesResponse = await getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
    for (const type of (typesResponse?.results ?? []) as ResourceTypeDto[]) {
      resourceTypeNames[type.id] = type.name
    }
  } catch (error) {
    console.warn("Failed to load resource types", error)
  }

  return (
    <ResourceRateTable
      data={results}
      totalCount={total}
      resourceTypeNames={resourceTypeNames}
      activeResourceTypeId={resourceTypeId}
    />
  )
}
