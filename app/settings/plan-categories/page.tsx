import { Suspense } from "react"
import { AddPlanCategoryButton } from "./add-plan-category-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { PlanCategoryTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function PlanCategoriesPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Plan Categories</h1>
                <AddPlanCategoryButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
                <PlanCategoryTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
