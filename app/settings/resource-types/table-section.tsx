import { getListResourceTypes } from "@/lib/service"
import type { ListResourceTypesParams, ResourceTypeDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { ResourceTypeTable } from "./resource-type-table"

export async function ResourceTypeTableSection({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }>) {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
    const pageParam = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams?.page[0] : resolvedSearchParams?.page
    const pageSizeParam = Array.isArray(resolvedSearchParams?.pageSize) ? resolvedSearchParams?.pageSize[0] : resolvedSearchParams?.pageSize
    const nameParam = Array.isArray(resolvedSearchParams?.name) ? resolvedSearchParams?.name[0] : resolvedSearchParams?.name
    const page = Number(pageParam) || 1
    const pageSize = Number(pageSizeParam) || 10



    const query: ListResourceTypesParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: "ASC",
        q: nameParam,
    }

    let results: ResourceTypeDto[] = []
    let total = 0
    try {
        const response = await getListResourceTypes(query)
        ;({ results, total } = pageResult<ResourceTypeDto>(response))
    } catch (error) {
        console.warn("Failed to load resource types", error)
    }

    return <ResourceTypeTable data={results} totalCount={total} />
}

