import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
    rows?: number
    columns?: number
}

/**
 * Shared loading placeholder for the list pages. Each page used to ship its own
 * copy; they were identical apart from the column count.
 */
export function TableSkeleton({ rows = 10, columns = 6 }: Readonly<TableSkeletonProps>) {
    return (
        <div className="w-full border rounded-md">
            <div className="flex items-center justify-between p-4 border-b">
                <Skeleton className="h-8 w-40" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4 p-4"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: columns }).map((_, cellIndex) => (
                            <Skeleton key={cellIndex} className="h-5" />
                        ))}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    )
}
