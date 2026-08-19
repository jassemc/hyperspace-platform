import { Suspense } from "react"
import { AddAssignmentButton } from "./add-assignment-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { AssignmentTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function AssignmentsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Assignments</h1>
                <AddAssignmentButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
                <AssignmentTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
