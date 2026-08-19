import { Suspense } from "react"
import { AddBookingButton } from "./add-booking-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { BookingTableSection } from "./table-section"
import { SectionCards } from "./section-cards"

export default async function BookingsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Bookings</h1>
                <AddBookingButton />
            </div>
            <SectionCards />
            <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                <BookingTableSection searchParams={resolvedSearchParams} />
            </Suspense>
        </div>
    )
}
