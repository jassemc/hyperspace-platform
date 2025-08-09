import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { columns } from "./resources";
import { DataTable } from "./data-table";

import { getResources, } from "@/lib/service";
import { PageDto } from "@/lib/service/HsService";

import type { GetResourcesParams, ResourceDto, } from "@/lib/service/HsService";

async function getData(): Promise<ResourceDto[]> {
    const query = {
        limit: 10,
        offset: 0,
        sort: "ASC",
    } as GetResourcesParams;

    const data: PageDto & {
        results?: Array<ResourceDto>;
    } = await getResources(query);

    return data.results;
}

export default async function ResourcesPage() {
    const data = await getData()

    return (
        <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <div className="container mx-auto py-10">
                    <DataTable columns={columns} data={data} />
                </div>
            </TabsContent>
            <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
    )
}
