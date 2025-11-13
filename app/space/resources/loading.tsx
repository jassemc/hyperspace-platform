import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "./table-skeleton";

export default function Loading() {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-9 w-36" />
            </div>
            <div className="h-px w-full bg-border mb-4" />
            <TableSkeleton rows={10} />
        </div>
    );
}


