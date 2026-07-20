import { Suspense } from "react";
import { AddResourceButton } from "./add-resource-button";
import { TableSkeleton } from "./table-skeleton";
import { ResourceTableSection } from "./table-section";
import { SectionCards } from "./section-cards";

export default async function SpaceResourcesPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams
    return (
        <div className="w-full py-6">
            
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-5xl font-semibold">Resources</h1>
                <AddResourceButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} />}>
                <ResourceTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    );
}


