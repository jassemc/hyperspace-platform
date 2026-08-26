import { Skeleton } from "@/components/ui/skeleton"

export function CalendarSkeleton() {
  return (
    <div className="mx-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-md" />
    </div>
  )
}
