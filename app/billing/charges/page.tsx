import { Suspense } from "react"
import { AddChargeButton } from "./add-charge-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { ChargeTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function ChargesPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Charges</h1>
                <AddChargeButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                <ChargeTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
