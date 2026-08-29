import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/table-skeleton"

export default function Loading() {
    return (
        <div className="w-full py-6">
            <div className="px-4">
                <Skeleton className="h-8 w-40 mb-4" />
            </div>
            <div className="py-2 px-4 mb-6">
                <Skeleton className="h-12 w-80" />
            </div>
            <div className="px-4 pb-4">
                <Skeleton className="h-9 w-72 rounded-lg" />
            </div>
            <TableSkeleton rows={5} />
        </div>
    )
}
