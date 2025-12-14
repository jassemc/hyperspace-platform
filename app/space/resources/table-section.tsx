import { getResources } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";
import type { GetResourcesParams, ResourceDto } from "@/lib/service/HsService";
import { ResourceTable } from "./resource-table";

export async function ResourceTableSection({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }>) {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
    const pageParam = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams?.page[0] : resolvedSearchParams?.page
    const pageSizeParam = Array.isArray(resolvedSearchParams?.pageSize) ? resolvedSearchParams?.pageSize[0] : resolvedSearchParams?.pageSize
    const page = Number(pageParam) || 1
    const pageSize = Number(pageSizeParam) || 10

    const statusParam = Array.isArray(resolvedSearchParams?.status) ? resolvedSearchParams?.status[0] : resolvedSearchParams?.status

    const query: GetResourcesParams = {
        limit: statusParam ? 1000 : pageSize, // Fetch all (up to 1000) if filtering, else page size
        offset: statusParam ? 0 : (page - 1) * pageSize, // Start from 0 if filtering
        sort: "ASC",
        status: statusParam,
    }

    let results: ResourceDto[] = []
    let total = 0
    try {
        const response = await getResources(query) as unknown as PageDto & { results?: ResourceDto[] }
        let allResults = response.results ?? []

        // Fallback: If backend returned unfiltered results despite status param, filter manually
        if (statusParam) {
            const initialCount = allResults.length
            allResults = allResults.filter(r => r.status === statusParam)

            // If manual filter reduced the count, it means backend didn't handle it.
            // Even if it didn't reduce count, we might have just been lucky or fetched few items.
            // To be safe, if we are in "filter mode", we assume we have "all" items (due to limit 1000)
            // and we rely on our manual slice for pagination.

            total = allResults.length

            // Apply Manual Pagination
            const start = (page - 1) * pageSize
            const end = start + pageSize
            results = allResults.slice(start, end)
        } else {
            results = allResults
            total = response.meta?.totalItems ?? results.length
        }

    } catch (error) {
        console.warn("Failed to load resources", error)
    }

    return <ResourceTable data={results} totalCount={total} />
}


