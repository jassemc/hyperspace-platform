import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
    rows?: number;
}

export function TableSkeleton({ rows = 10 }: Readonly<TableSkeletonProps>) {
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
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 p-4">
                        <Skeleton className="h-5 col-span-2" />
                        <Skeleton className="h-5 col-span-1" />
                        <Skeleton className="h-5 col-span-1" />
                        <Skeleton className="h-5 col-span-1" />
                        <Skeleton className="h-5 col-span-1" />
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
    );
}


