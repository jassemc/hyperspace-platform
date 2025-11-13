import { Suspense } from "react"
import { AddResourceTypeButton } from "./add-resource-type-button"
import { TableSkeleton } from "./table-skeleton"
import { ResourceTypeTableSection } from "./table-section"

export default async function SpaceResourceTypesPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Resource Types</h1>
                <AddResourceTypeButton />
            </div>
            <Suspense fallback={<TableSkeleton rows={10} />}>
                <ResourceTypeTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}

