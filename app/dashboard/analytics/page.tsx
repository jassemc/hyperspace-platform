import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { RevenueSection } from "./revenue-section"
import { OccupancySection } from "./occupancy-section"
import { MembershipSection } from "./membership-section"

function SectionFallback() {
    return (
        <div className="px-4">
            <Skeleton className="h-48 w-full rounded-md" />
        </div>
    )
}

export default async function AnalyticsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Analytics</h1>
            </div>

            <div className="space-y-8">
                <Suspense fallback={<SectionFallback />}>
                    <RevenueSection searchParams={resolvedSearchParams} />
                </Suspense>
                <Suspense fallback={<SectionFallback />}>
                    <OccupancySection searchParams={resolvedSearchParams} />
                </Suspense>
                <Suspense fallback={<SectionFallback />}>
                    <MembershipSection />
                </Suspense>
            </div>
        </div>
    )
}
