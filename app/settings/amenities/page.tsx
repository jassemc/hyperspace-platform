import { Suspense } from "react"
import { AddAmenityButton } from "./add-amenity-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { AmenityTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function AmenitysPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Amenities</h1>
                <AddAmenityButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={5} />}>
                <AmenityTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
