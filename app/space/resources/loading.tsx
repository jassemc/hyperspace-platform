import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "./table-skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-9 w-36" />
            </div>
            <TableSkeleton rows={10} />
        </div>
    );
}


