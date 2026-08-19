import { Suspense } from "react"
import { AddOpportunityButton } from "./add-opportunity-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { OpportunityTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function OpportunitysPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Opportunities</h1>
                <AddOpportunityButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                <OpportunityTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
