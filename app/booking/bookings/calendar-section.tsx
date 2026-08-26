import { getBookingCalendar, getListResourceTypes } from "@/lib/service"
import type { BookingCalendarDto, ResourceTypeDto } from "@/lib/service/HsService"
import { firstParam, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { rangeFor, type CalendarView } from "@/components/booking/calendar/types"
import { CalendarViews } from "@/components/booking/calendar/calendar-views"

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

  // canBook is the flag, not bookingMode, which describes pricing rather
  // than whether a thing can be booked at all.
  const typePage = await getListResourceTypes({
    limit: 100,
    offset: 0,
    sort: "ASC",
  }).catch(() => null)
  const bookableTypes = ((typePage?.results ?? []) as ResourceTypeDto[]).filter(
    (type) => type.canBook
  )

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

  return (
    <CalendarViews calendar={calendar!} state={state} bookableTypes={bookableTypes} />
  )
}
