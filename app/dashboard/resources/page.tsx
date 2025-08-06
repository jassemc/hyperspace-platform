import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { columns, Resources } from "./resources";
import { DataTable } from "./data-table";

async function getData(): Promise<Resources[]> {
    // Fetch data from your API here.
    return [
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        {
            id: "728ed52f",
            name: 'desk',
            status: "pending",
            price: 199,
        },
        
    ]
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
