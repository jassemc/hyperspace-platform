import { getResourceTypes } from "@/lib/service"
import { PageDto } from "@/lib/service/HsService"
import type { GetResourceTypesParams, ResourceTypeDto } from "@/lib/service/HsService"
import { ResourceTypeTable } from "./resource-type-table"

export async function ResourceTypeTableSection({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }>) {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
    const pageParam = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams?.page[0] : resolvedSearchParams?.page
    const pageSizeParam = Array.isArray(resolvedSearchParams?.pageSize) ? resolvedSearchParams?.pageSize[0] : resolvedSearchParams?.pageSize
    const page = Number(pageParam) || 1
    const pageSize = Number(pageSizeParam) || 10

    const query: GetResourceTypesParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: "ASC",
    }

    let results: ResourceTypeDto[] = []
    let total = 0
    try {
        const response: PageDto & { results?: Array<ResourceTypeDto>; } = await getResourceTypes(query)
        results = response.results ?? []
        total = response.meta?.totalItems ?? results.length
    } catch (error) {
        console.warn("Failed to load resource types", error)
    }

    return <ResourceTypeTable data={results} totalCount={total} />
}

