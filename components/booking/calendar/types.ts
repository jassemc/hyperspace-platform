import { wallClockToUtcMs } from "@/lib/slots"

export type CalendarView = "day" | "week" | "month"

/** Minutes between offered start times, everywhere in the booking UI. */
export const SLOT_STEP_MIN = 30

/** Half-hours across a day, "HH:mm". Shared by the toolbar's time range,
 *  the slot picker and the manual date-time field, so the three surfaces
 *  cannot offer different times for the same booking. */
export const HALF_HOURS: string[] = Array.from(
  { length: (24 * 60) / SLOT_STEP_MIN },
  (_, index) => {
    const minutes = index * SLOT_STEP_MIN
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`
  }
)

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
 * `date` stepped by whole calendar months, with the day-of-month clamped
 * to the target month's length. `Date#setUTCMonth` alone does not clamp —
 * it overflows into the month after when the source day doesn't exist
 * there, e.g. Jan 31 + 1 month silently becomes Mar 3 rather than Feb 28,
 * and that drifted day-of-month then persists into every later step.
 */
export function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number)
  const targetFirst = new Date(Date.UTC(year, month - 1 + months, 1))
  const daysInTarget = new Date(
    Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth() + 1, 0)
  ).getUTCDate()
  const clampedDay = Math.min(day, daysInTarget)
  return new Date(
    Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth(), clampedDay)
  )
    .toISOString()
    .slice(0, 10)
}

const DAY_MS = 86_400_000
/** The endpoint's own ceiling — see availability.service.ts's `date_range_too_wide`. */
export const MAX_RANGE_MS = 31 * DAY_MS

/**
 * The instants a view covers, bounded in the grid's own timezone — never
 * in the reader's — and clamped to 31 days, the API's ceiling.
 *
 * A calendar month's wall-clock span is not always exactly N*24h: a
 * 31-day month that contains a DST fall-back (October in most of Europe
 * and Africa/Cairo, November in America/New_York, April in the southern
 * hemisphere) is 31 days and one hour wide, which is over the endpoint's
 * cap and 422s the whole month — one month a year, in every zone that
 * observes DST. The clamp is safe against the server's own day
 * enumeration: it emits days up to the local day of `to - 1ms`, so an
 * upper bound short of the next month's midnight still includes the
 * 31st. Day and week spans are far under the cap, so it is a no-op for
 * them and their own DST hour is preserved.
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

  const fromMs = wallClockToUtcMs(startDay, "00:00", timeZone)
  const toMs = Math.min(
    wallClockToUtcMs(addDays(startDay, span), "00:00", timeZone),
    fromMs + MAX_RANGE_MS
  )

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  }
}
