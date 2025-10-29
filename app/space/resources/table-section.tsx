import { getResources } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";
import type { GetResourcesParams, ResourceDto } from "@/lib/service/HsService";
import { ResourceTable } from "./resource-table";

export async function ResourceTableSection({ searchParams }: Readonly<{ searchParams?: Record<string, string | string[] | undefined> }>) {
    const pageParam = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page
    const pageSizeParam = Array.isArray(searchParams?.pageSize) ? searchParams?.pageSize[0] : searchParams?.pageSize
    const page = Number(pageParam) || 1
    const pageSize = Number(pageSizeParam) || 10

    const query: GetResourcesParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: "ASC",
    }

    let results: ResourceDto[] = []
    let total = 0
    try {
        const response: PageDto & { results?: Array<ResourceDto>; } = await getResources(query)
        results = response.results ?? []
        total = response.meta?.totalItems ?? results.length
    } catch (error) {
        console.warn("Failed to load resources", error)
    }

    return <ResourceTable data={results} totalCount={total} />
}


