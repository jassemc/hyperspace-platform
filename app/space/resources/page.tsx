import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { ResourceTable } from "./resource-table";
import { Suspense } from "react";

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
            <h1 className="text-2xl font-semibold mb-4">Resources</h1>
            <Tabs defaultValue="list" className="w-full">
                <TabsList>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                    <div className="py-6">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ResourceTable data={data} />
                        </Suspense>
                    </div>
                </TabsContent>
                <TabsContent value="other">Content coming soon.</TabsContent>
            </Tabs>
        </div>
    );
}


