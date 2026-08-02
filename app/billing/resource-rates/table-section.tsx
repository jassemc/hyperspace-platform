import { getListResourceRates, getListResources, getResource } from "@/lib/service"
import type { ListResourceRatesParams, ResourceRateDto, ResourceDto } from "@/lib/service/HsService"
import { ResourceRateTable } from "./resource-rate-table"

type ResourceRatesPage = { results?: ResourceRateDto[]; meta?: { totalItems?: number } }
type ResourcesPage = { results?: ResourceDto[] }

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * Rates only carry `resourceId`, so names are resolved separately. One bulk page
 * covers the common case; ids still unresolved after that (resource outside the
 * page, or filtered out of the list) are fetched individually so the Resource
 * column never has to fall back to a raw uuid.
 */
async function resolveResourceNames(rates: ResourceRateDto[]): Promise<Record<string, string>> {
  const wantedIds = [...new Set(rates.map((rate) => rate.resourceId).filter(Boolean))]
  if (wantedIds.length === 0) return {}

  const resourcesById: Record<string, string> = {}

  try {
    const bulk = (await getListResources({ limit: 100, offset: 0, sort: "ASC" })) as ResourcesPage
    for (const resource of bulk.results ?? []) {
      resourcesById[resource.id] = resource.name
    }
  } catch (error) {
    console.warn("Failed to load resources for rate name lookup", error)
  }

  const missingIds = wantedIds.filter((id) => !resourcesById[id])
  if (missingIds.length > 0) {
    const fetched = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const resource = (await getResource(id)) as ResourceDto
          return [id, resource.name] as const
        } catch (error) {
          console.warn(`Failed to resolve resource ${id}`, error)
          return null
        }
      })
    )

    for (const entry of fetched) {
      if (entry) resourcesById[entry[0]] = entry[1]
    }
  }

  return resourcesById
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

  const query: ListResourceRatesParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
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

  const resourcesById = await resolveResourceNames(results)

  return <ResourceRateTable data={results} totalCount={total} resourcesById={resourcesById} />
}
