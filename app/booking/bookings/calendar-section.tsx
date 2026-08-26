import { getBookingCalendar } from "@/lib/service"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { firstParam, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { rangeFor, type CalendarView } from "@/components/booking/calendar/types"

function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export async function BookingCalendarSection({
  searchParams,
  timeZone,
}: Readonly<{ searchParams?: SearchParamsInput; timeZone: string }>) {
  const params = await resolveSearchParams(searchParams)

  const view = (firstParam(params.calendarView) ?? "day") as CalendarView
  const date = firstParam(params.date) ?? todayIn(timeZone)
  const state = {
    view,
    date,
    resourceTypeId: firstParam(params.resourceTypeId),
    locationId: firstParam(params.locationId),
  }

  // Bounded in the grid's zone, not the reader's — the whole point of
  // carrying a timezone rather than assuming one.
  const { from, to } = rangeFor(state, timeZone)

  let calendar: BookingCalendarDto | null = null
  let error: string | null = null

  try {
    calendar = (await getBookingCalendar({
      from,
      to,
      resourceTypeId: state.resourceTypeId,
      locationId: state.locationId,
    })) as BookingCalendarDto
  } catch (cause) {
    // A room set spanning timezones is refused rather than drawn wrong;
    // say so instead of showing an empty grid.
    const problem = cause as { error?: { type?: string }; message?: string }
    error =
      problem?.error?.type === "mixed_location_calendar"
        ? "This selection spans more than one location. Pick a location to see its calendar."
        : (problem?.message ?? "The calendar could not be loaded.")
    console.warn("Failed to load booking calendar", cause)
  }

  if (error) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  // CalendarViews does not exist yet — Task 6 replaces this placeholder
  // with the real grid. This proves the fetch works: the location's
  // timezone and room count came back from the server.
  return (
    <pre className="mx-4 overflow-x-auto rounded-md border p-4 text-xs">
      {JSON.stringify(
        { timezone: calendar?.timezone, rooms: calendar?.resources.length },
        null,
        2
      )}
    </pre>
  )
}
