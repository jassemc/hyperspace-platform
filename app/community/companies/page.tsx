import { Suspense } from "react"
import { AddCompanyButton } from "./add-company-button"
import { TableSkeleton } from "./table-skeleton"
import { CompanyTableSection } from "./table-section"
import { SectionCards } from "./section-cards"
import { Skeleton } from "@/components/ui/skeleton"

export default async function CommunityCompaniesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const resolvedSearchParams = await searchParams

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between py-4 px-4 mb-8">
        <h1 className="text-5xl font-semibold">Companies</h1>
        <AddCompanyButton />
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <SectionCards />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <CompanyTableSection searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}
