import { Suspense } from "react"
import { AddPlanButton } from "./add-plan-button"
import { TableSkeleton } from "./table-skeleton"
import { PlanTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function SpacePlanPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const resolvedSearchParams = await searchParams

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between py-4 px-4 mb-8">
        <h1 className="text-5xl font-semibold">Plan</h1>
        <AddPlanButton />
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 w-full rounded-xl border bg-card/60" />
            ))}
          </div>
        }
      >
        <SectionCards />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <PlanTableSection searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}
