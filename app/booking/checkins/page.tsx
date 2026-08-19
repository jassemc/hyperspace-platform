import { Suspense } from "react"
import { AddCheckinButton } from "./add-checkin-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { CheckinTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function CheckinsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Check-ins</h1>
                <AddCheckinButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
                <CheckinTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
