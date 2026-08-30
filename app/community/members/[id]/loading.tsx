import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full py-6">
      <div className="px-4">
        <Skeleton className="mb-2 h-8 w-36" />
      </div>
      <div className="mb-6 space-y-4 px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
      <div className="min-w-0">
        <div className="mx-4 mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
