import { getListResources } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";
import type { ListResourcesParams, ResourceDto } from "@/lib/service/HsService";
import { ResourceTable } from "./resource-table";

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

    const query: ListResourcesParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: "ASC",
        q: searchQuery || undefined,
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

    return <ResourceTable data={results} totalCount={total} />
}


