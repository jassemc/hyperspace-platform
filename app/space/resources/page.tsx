import { ResourceTable } from "./resource-table";
import { AddResourceButton } from "./add-resource-button";

import { getResources } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";
import type { GetResourcesParams, ResourceDto } from "@/lib/service/HsService";

async function getData(): Promise<ResourceDto[]> {
    const query = {
        limit: 10,
        offset: 0,
        sort: "ASC",
    } as GetResourcesParams;

    try {
        const data: PageDto & { results?: Array<ResourceDto>; } = await getResources(query);
        return data.results ?? [];
    } catch (error) {
        // Avoid noisy server console errors that surface in the RSC dev overlay
        console.warn("Failed to load resources", error);
        return [];
    }
}

export default async function SpaceResourcesPage() {
    const data = await getData();

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Resources</h1>
                <AddResourceButton />
            </div>
            <ResourceTable data={data} />
        </div>
    );
}


