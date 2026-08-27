import { Suspense } from "react"
import { AddBookingButton } from "./add-booking-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { BookingTableSection } from "./table-section"
import { SectionCards } from "./section-cards"
import { ViewToggle } from "./view-toggle"
import { BookingCalendarSection } from "./calendar-section"
import { CalendarSkeleton } from "@/components/booking/calendar/calendar-skeleton"
import { firstParam } from "@/lib/search-params"
import { primaryTimeZone } from "@/lib/locations"

export default async function BookingsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams
    const isCalendar = firstParam(resolvedSearchParams?.view) === "calendar"
    const timeZone = await primaryTimeZone()

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Bookings</h1>
                <div className="flex items-center gap-3">
                    <ViewToggle />
                    <AddBookingButton timeZone={timeZone} />
                </div>
            </div>
            {/* The cards read the table's filters; the calendar's date
                scoping is not among them, so they say which set they
                describe rather than implying it follows the grid. */}
            <SectionCards
                searchParams={resolvedSearchParams}
                view={isCalendar ? "calendar" : "table"}
            />
            {isCalendar ? (
                <Suspense fallback={<CalendarSkeleton />}>
                    <BookingCalendarSection
                        searchParams={resolvedSearchParams}
                        timeZone={timeZone}
                    />
                </Suspense>
            ) : (
                <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                    <BookingTableSection searchParams={resolvedSearchParams} />
                </Suspense>
            )}
        </div>
    )
}
