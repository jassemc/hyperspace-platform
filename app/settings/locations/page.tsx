import { Suspense } from "react"
import { AddLocationButton } from "./add-location-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { LocationTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function LocationsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Locations</h1>
                <AddLocationButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
                <LocationTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
