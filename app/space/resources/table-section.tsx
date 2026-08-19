import { getListResources, getListResourceTypes } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";
import type { ListResourcesParams, ResourceDto, ResourceTypeDto } from "@/lib/service/HsService";
import { ResourceTable } from "./resource-table";
import { isResourceStatus } from "./resource-status";

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function ResourceTableSection({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }>) {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams

    const page = Number(firstParam(resolvedSearchParams?.page)) || 1
    const pageSize = Number(firstParam(resolvedSearchParams?.pageSize)) || 10
    const searchQuery = firstParam(resolvedSearchParams?.name)
    const resourceTypeId = firstParam(resolvedSearchParams?.resourceTypeId)
    const statusParam = firstParam(resolvedSearchParams?.status)

    const query: ListResourcesParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: "ASC",
        q: searchQuery || undefined,
        resourceTypeId: resourceTypeId || undefined,
        status: isResourceStatus(statusParam) ? statusParam : undefined,
    }

    let results: ResourceDto[] = []
    let total = 0
    try {
        const response = await getListResources(query) as unknown as PageDto & { results?: ResourceDto[] }
        results = response.results ?? []
        total = response.meta?.totalItems ?? results.length
    } catch (error) {
        console.warn("Failed to load resources", error)
    }

    // Resources only carry a resourceTypeId, so resolve the type names for the table.
    const resourceTypeNames: Record<string, string> = {}
    try {
        const typesResponse = await getListResourceTypes({
            limit: 100, // API max limit is 100
            offset: 0,
            sort: "ASC",
        })
        for (const type of (typesResponse?.results ?? []) as ResourceTypeDto[]) {
            resourceTypeNames[type.id] = type.name
        }
    } catch (error) {
        console.warn("Failed to load resource types", error)
    }

    return (
        <ResourceTable
            data={results}
            totalCount={total}
            resourceTypeNames={resourceTypeNames}
            activeResourceTypeId={resourceTypeId}
            activeStatus={isResourceStatus(statusParam) ? statusParam : undefined}
        />
    )
}


