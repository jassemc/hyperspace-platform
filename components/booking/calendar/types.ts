import { wallClockToUtcMs } from "@/lib/slots"

export type CalendarView = "day" | "week" | "month"

/** Today's date, YYYY-MM-DD, as it reads in `timeZone` — never the reader's. */
export function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export interface CalendarViewState {
  view: CalendarView
  /** Anchor day, YYYY-MM-DD in the grid's timezone. */
  date: string
  resourceTypeId?: string
  /** Narrows the week view to one room. */
  resourceId?: string
  locationId?: string
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Monday of the week containing `date`. */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  const shift = (d.getUTCDay() + 6) % 7
  return addDays(date, -shift)
}

/**
 * The instants a view covers, bounded in the grid's own timezone — never
 * in the reader's. Month is clamped to 31 days, which is also the API's
 * ceiling.
 */
export function rangeFor(
  state: CalendarViewState,
  timeZone: string
): { from: string; to: string } {
  const startDay =
    state.view === "day"
      ? state.date
      : state.view === "week"
        ? weekStartOf(state.date)
        : `${state.date.slice(0, 7)}-01`

  const span = state.view === "day" ? 1 : state.view === "week" ? 7 : 31

  return {
    from: new Date(wallClockToUtcMs(startDay, "00:00", timeZone)).toISOString(),
    to: new Date(
      wallClockToUtcMs(addDays(startDay, span), "00:00", timeZone)
    ).toISOString(),
  }
}
