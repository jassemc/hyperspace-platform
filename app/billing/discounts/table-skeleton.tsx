import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  rows?: number
}

export function TableSkeleton({ rows = 10 }: Readonly<TableSkeletonProps>) {
  return (
    <div className="space-y-3 px-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
