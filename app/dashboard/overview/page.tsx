import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewStats } from "./overview-stats"
import { AttentionLists } from "./attention-lists"

function StatsFallback() {
    return (
        <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
        </div>
    )
}

function ListsFallback() {
    return (
        <div className="space-y-8 px-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-md" />
            ))}
        </div>
    )
}

export default function OverviewPage() {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Overview</h1>
            </div>

            <Suspense fallback={<StatsFallback />}>
                <OverviewStats />
            </Suspense>

            <Suspense fallback={<ListsFallback />}>
                <AttentionLists />
            </Suspense>
        </div>
    )
}
