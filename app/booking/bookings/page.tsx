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
import { bookingLookups } from "./lookups"

export default async function BookingsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams
    const isCalendar = firstParam(resolvedSearchParams?.view) === "calendar"
    const [timeZone, lookups] = await Promise.all([primaryTimeZone(), bookingLookups()])

    return (
        // Calendar mode is a viewport-fit column: the page itself never
        // scrolls (either axis) — the grid is the only scroll surface.
        // 4rem is the layout header's h-16. Table mode is unchanged.
        <div
            className={
                isCalendar
                    ? "flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden pt-6"
                    : "w-full py-6"
            }
        >
            <div
                className={`flex shrink-0 items-center justify-between px-4 py-4 ${
                    isCalendar ? "mb-2" : "mb-8"
                }`}
            >
                <h1 className="text-4xl font-semibold">Bookings</h1>
                <div className="flex items-center gap-3">
                    <ViewToggle />
                    <AddBookingButton timeZone={timeZone} lookups={lookups} />
                </div>
            </div>
            {/* The cards read the table's filters; the calendar's date
                scoping is not among them, so they say which set they
                describe rather than implying it follows the grid. */}
            <div className="shrink-0">
                <SectionCards
                    searchParams={resolvedSearchParams}
                    view={isCalendar ? "calendar" : "table"}
                />
            </div>
            {isCalendar ? (
                <div className="flex min-h-0 flex-1 flex-col">
                    <Suspense fallback={<CalendarSkeleton />}>
                        <BookingCalendarSection
                            searchParams={resolvedSearchParams}
                            timeZone={timeZone}
                        />
                    </Suspense>
                </div>
            ) : (
                <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                    <BookingTableSection searchParams={resolvedSearchParams} />
                </Suspense>
            )}
        </div>
    )
}
