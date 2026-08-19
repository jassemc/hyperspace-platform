import { Suspense } from "react"
import { AddExtraButton } from "./add-extra-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { ExtraTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function ExtrasPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Extras</h1>
                <AddExtraButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
                <ExtraTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
