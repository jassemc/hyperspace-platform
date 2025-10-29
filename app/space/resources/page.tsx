import { Suspense } from "react";
import { AddResourceButton } from "./add-resource-button";
import { TableSkeleton } from "./table-skeleton";
import { ResourceTableSection } from "./table-section";
import { Separator } from "@/components/ui/separator";

export default function SpaceResourcesPage({ searchParams }: Readonly<{ searchParams?: Record<string, string | string[] | undefined> }>) {
    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between py-4">
                <h1 className="text-2xl font-semibold">Resources</h1>
                <AddResourceButton />
            </div>
            <Separator className="mb-4" />
            <Suspense fallback={<TableSkeleton rows={10} />}>
                <ResourceTableSection searchParams={searchParams} />
            </Suspense>
        </div>
    );
}


