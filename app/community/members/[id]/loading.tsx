import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="w-full py-6">
      <div className="px-4">
        <Skeleton className="mb-2 h-8 w-36" />
      </div>
      <div className="grid gap-6 px-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-[520px] w-full rounded-xl" />
        <div className="min-w-0">
          <div className="px-4 pb-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
