"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { DayPicker, type DayButtonProps } from "react-day-picker"
import { getResourceAvailability } from "@/lib/service"
import type { AvailabilityDayDto, AvailabilityDto } from "@/lib/service/HsService"
import {
  durationChoices,
  freeRangesForDay,
  startOptionsForDuration,
  wallClockToUtcMs,
  type Slot,
} from "@/lib/slots"
// Not redefined here: this is the third caller, and three copies of a
// "today, in the location's zone" helper is how one of them drifts.
import { todayIn } from "@/components/booking/calendar/types"
import { formatTimeOfDay } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SlotValue {
  /** Wall-clock in the location's zone, "YYYY-MM-DDTHH:mm" — the shape
   *  actions.ts:toUtcIso reads, paired with the hidden timeZone field. */
  startsAt: string
  endsAt: string
}

/**
 * A UTC instant as "YYYY-MM-DDTHH:mm" in `timeZone`.
 *
 * Assembled from `formatToParts` rather than a formatted string glued
 * together: the previous version relied on `sv-SE` emitting a plain space
 * between date and time and replaced it with "T" — a locale's separator is
 * an ICU implementation detail, not a contract (`en-US`'s AM/PM separator
 * changed under us once already). If it silently changed here, `.replace`
 * would no-op, the value would come out without a "T", and
 * `value.startsAt.split("T")` would hand `undefined` to `wallClockToUtcMs`,
 * which throws on `.split(":")`.
 */
function toWallClock(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

const monthOf = (date: string) => date.slice(0, 7)

const DAY_MS = 86_400_000
/** The endpoint's own ceiling — see availability.service.ts's `date_range_too_wide`. */
const MAX_RANGE_MS = 31 * DAY_MS

/**
 * "YYYY-MM" as its first instant, and the first instant of the month
 * after — clamped to 31 days.
 *
 * A calendar month's wall-clock span is not always exactly N*24h: a
 * 31-day month that contains a DST fall-back (e.g. October in any
 * Europe/* zone that observes one) is 31 days and one hour wide, which is
 * over the endpoint's cap and 422s the whole month. The clamp is safe
 * against the server's own day enumeration — it emits days up to the
 * local day of `to - 1ms`, so an upper bound short of the next month's
 * midnight still includes the 31st.
 */
function monthRange(month: string, timeZone: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number)
  const first = `${month}-01`
  const nextMonth = new Date(Date.UTC(year, m, 1))
  const next = `${nextMonth.getUTCFullYear()}-${String(
    nextMonth.getUTCMonth() + 1
  ).padStart(2, "0")}-01`
  const fromMs = wallClockToUtcMs(first, "00:00", timeZone)
  const toMs = Math.min(wallClockToUtcMs(next, "00:00", timeZone), fromMs + MAX_RANGE_MS)
  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  }
}

const PERIODS = ["Morning", "Afternoon", "Evening"] as const

/** Wall-clock hour (0–23) of a UTC instant in a zone. */
function hourIn(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone })
      .format(new Date(iso))
  )
}

function periodOf(slot: Slot, timeZone: string): (typeof PERIODS)[number] {
  const hour = hourIn(slot.startUtc, timeZone)
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"
}

/**
 * Whether a UTC instant survives being shown as a wall clock and read back:
 * "YYYY-MM-DDTHH:mm" is not injective across a DST fall-back — two
 * instants an hour apart can format to the same wall-clock string, and
 * wallClockToUtcMs's correction always resolves the ambiguous string to
 * the later of the two. An instant that fails this either books an hour
 * later than the button says (if it's the start) or an hour longer than
 * the duration chip says (if it's the end) — both are the same defect,
 * the button lying about what it books, just on different edges of the
 * slot.
 */
function roundTripsCleanly(iso: string, timeZone: string): boolean {
  const wallClock = toWallClock(iso, timeZone)
  const roundTripMs = wallClockToUtcMs(
    wallClock.slice(0, 10),
    wallClock.slice(11),
    timeZone
  )
  return roundTripMs === Date.parse(iso)
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** "YYYY-MM-DD" of a `Date`, read with the same local getters the day grid uses. */
const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/** A local calendar date (midnight, no timezone conversion) from "YYYY-MM-DD". */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * What a day's zero free starts actually means — "N free" otherwise, so a
 * screen-reader user (and the count printed in the cell) can tell "fully
 * booked" from "closed" from "already past" instead of hearing only a date.
 */
function dayStatusLabel(
  date: string,
  count: number,
  day: AvailabilityDayDto | undefined,
  nowMs: number,
  timeZone: string
): string {
  if (count > 0) return `${count} free`
  if (!day || day.windows.length === 0) return "Closed"
  const dayEnd = Math.max(...day.windows.map((w) => wallClockToUtcMs(date, w.close, timeZone)))
  return nowMs >= dayEnd ? "Past" : "Fully booked"
}

const LONG_DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
})

/**
 * Per-day free counts and status, read by the day cell and by its
 * `aria-label`. Passed through context rather than closed over so
 * `DayCountButton` stays a stable module-level component — one defined
 * inside `BookingSlotPicker`'s render would be a new type on every render,
 * remounting every cell and losing the focus state react-day-picker keeps
 * in one. Mirrors `components/booking/calendar/month-overview.tsx`'s
 * `DayLoadContext`/`DayLoadButton` for the same reason.
 */
const DayStatusContext = createContext<Map<string, { count: number; label: string }>>(
  new Map()
)

/**
 * Mirrors the library's own DayButton (see
 * node_modules/react-day-picker/dist/esm/components/DayButton.js): `day`
 * and `modifiers` are destructured out so they never reach the DOM, and
 * the focused-modifier effect is what moves real keyboard focus as the
 * grid is arrowed through.
 */
function DayCountButton({ day, modifiers, className, ...buttonProps }: DayButtonProps) {
  const statusByKey = useContext(DayStatusContext)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const entry = statusByKey.get(toKey(day.date))

  return (
    <button ref={ref} {...buttonProps} className={className}>
      <span>{day.date.getDate()}</span>
      {entry && entry.count > 0 && (
        <span className="text-[9px] leading-none tabular-nums text-muted-foreground">
          {entry.count}
        </span>
      )}
    </button>
  )
}

const dayPickerComponents = { DayButton: DayCountButton }

/**
 * The day's shape at a glance: open windows as ground, busy blocks
 * hatched, elapsed time greyed, the chosen slot filled. Ported from the
 * public wizard's DayTimeline, which is the one element staff and
 * visitors both read the same way.
 */
function DayTimeline({
  availability,
  date,
  selected,
  timeZone,
  nowMs,
}: Readonly<{
  availability: AvailabilityDto
  date: string
  selected: Slot | null
  timeZone: string
  nowMs: number
}>) {
  const day = availability.days.find((entry) => entry.date === date)
  if (!day || day.windows.length === 0) return null

  const dayStart = Math.min(
    ...day.windows.map((w) => wallClockToUtcMs(date, w.open, timeZone))
  )
  const dayEnd = Math.max(
    ...day.windows.map((w) => wallClockToUtcMs(date, w.close, timeZone))
  )
  const span = dayEnd - dayStart
  if (span <= 0) return null

  const pct = (ms: number) =>
    `${Math.min(100, Math.max(0, ((ms - dayStart) / span) * 100))}%`

  const busy = availability.busy
    .map((b) => ({ start: Date.parse(b.startsAt), end: Date.parse(b.endsAt) }))
    .filter((b) => b.end > dayStart && b.start < dayEnd)

  const ticks: number[] = []
  for (let t = dayStart; t <= dayEnd; t += 2 * 3_600_000) ticks.push(t)

  return (
    <div aria-hidden="true" className="select-none">
      <div className="relative h-8 overflow-hidden rounded-md border bg-muted">
        {day.windows.map((w) => {
          const open = wallClockToUtcMs(date, w.open, timeZone)
          const close = wallClockToUtcMs(date, w.close, timeZone)
          return (
            <div
              key={`${w.open}-${w.close}`}
              className="absolute inset-y-0 bg-background"
              style={{ left: pct(open), width: `calc(${pct(close)} - ${pct(open)})` }}
            />
          )
        })}
        {nowMs > dayStart && (
          <div
            className="absolute inset-y-0 left-0 bg-muted-foreground/15"
            style={{ width: pct(Math.min(nowMs, dayEnd)) }}
          />
        )}
        {busy.map((b) => (
          <div
            // A multi-capacity resource can hold two busy intervals with
            // the same start, so the start alone isn't a unique key.
            key={`${b.start}-${b.end}`}
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0,var(--color-muted-foreground)_2px,transparent_2px,transparent_7px)] opacity-40"
            style={{
              left: pct(Math.max(b.start, dayStart)),
              width: `calc(${pct(Math.min(b.end, dayEnd))} - ${pct(Math.max(b.start, dayStart))})`,
            }}
          />
        ))}
        {selected && (
          <div
            className="absolute inset-y-1 rounded-sm bg-primary"
            style={{
              left: pct(Date.parse(selected.startUtc)),
              width: `calc(${pct(Date.parse(selected.endUtc))} - ${pct(Date.parse(selected.startUtc))})`,
            }}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-muted-foreground">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pct(t) }}>
            {formatTimeOfDay(new Date(t).toISOString(), timeZone)}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Pick a booking window from what the room is actually free for.
 *
 * Availability is fetched per resource and per displayed month, the way
 * the public wizard does — the endpoint caps a range at 31 days, so a
 * month is the natural page.
 */
export function BookingSlotPicker({
  resourceId,
  timeZone,
  value,
  onChange,
  excludeBookingId,
}: Readonly<{
  resourceId: string
  timeZone: string
  value: SlotValue | null
  onChange: (value: SlotValue | null) => void
  excludeBookingId?: string
}>) {
  const today = todayIn(timeZone)
  const [month, setMonth] = useState(() => monthOf(value?.startsAt ?? today))
  const [date, setDate] = useState<string | null>(
    value ? value.startsAt.slice(0, 10) : null
  )
  const [availability, setAvailability] = useState<AvailabilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [durationMin, setDurationMin] = useState<number | null>(null)

  // Captured once per mount: clips the past out of today's free ranges.
  // Not re-read on an interval — a slot list that silently drops its
  // first row mid-click is worse than one a few minutes stale.
  const [nowMs] = useState(() => Date.now())

  // The earliest navigable month: today's, unless the initial value (a
  // reschedule already in the past) starts before it — fixed at mount, not
  // re-tracked as the user pages, or paging itself would keep dragging the
  // floor backwards with them and never actually bound anything.
  const [startMonth] = useState(() => {
    const todayFirst = toLocalDate(`${today.slice(0, 7)}-01`)
    const monthFirst = toLocalDate(`${monthOf(value?.startsAt ?? today)}-01`)
    return monthFirst < todayFirst ? monthFirst : todayFirst
  })

  useEffect(() => {
    if (!resourceId) {
      setAvailability(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setFailed(false)
    const { from, to } = monthRange(month, timeZone)
    getResourceAvailability({ id: resourceId, from, to, excludeBookingId })
      .then((data) => {
        if (cancelled) return
        setAvailability(data)
      })
      .catch((error) => {
        if (cancelled) return
        console.error("Failed to load availability", error)
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resourceId, month, timeZone, excludeBookingId])

  // The invariant "a slot belongs to the resource it was picked for" lives
  // here, not in the caller: switching resources already invalidates the
  // availability fetched above, but the previously chosen startsAt/endsAt
  // would otherwise survive untouched, still paint on the new resource's
  // timeline, and 409 on submit.
  //
  // Cleared only when resourceId changed but value did NOT change in the
  // same commit — not on every resourceId change. A parent can legitimately
  // hand this component a fresh resourceId and a fresh value together in
  // one update (booking-form-dialog.tsx re-seeds both when reopened for a
  // different calendar-cell prefill, without remounting this component in
  // between); nulling that incoming value right back out would make every
  // reopen drop the cell the user actually clicked. "value's reference is
  // unchanged" is what actually distinguishes "the room changed under an
  // untouched selection" (must clear) from "the caller just handed us a new
  // pair together" (trust it) — a plain `[resourceId]` effect can't tell
  // those apart. No dependency array: it must compare against the previous
  // render's props every time, which a deps array would prevent.
  const prevResourceIdRef = useRef(resourceId)
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (prevResourceIdRef.current !== resourceId && prevValueRef.current === value) {
      onChange(null)
    }
    prevResourceIdRef.current = resourceId
    prevValueRef.current = value
  })

  // A parent can hydrate an existing booking's slot only after this
  // mounts (e.g. a reschedule dialog that fetches the booking async), and
  // the once-only initializers above would then leave month/date on
  // whatever they picked at mount. Re-sync whenever the value's day
  // differs from what's shown locally; a value produced by this
  // component's own pickSlot always shares the day already picked, so
  // this never fights the user mid-pick.
  useEffect(() => {
    if (!value) return
    const valueDate = value.startsAt.slice(0, 10)
    if (valueDate === date) return
    setDate(valueDate)
    setMonth(monthOf(valueDate))
  }, [value, date])

  const durations = useMemo(
    () =>
      durationChoices(
        availability?.minDurationMin ?? null,
        availability?.maxDurationMin ?? null
      ),
    [availability?.minDurationMin, availability?.maxDurationMin]
  )

  // The resource decides the choices, so a duration picked for a previous
  // resource may not exist here — fall back to the shortest rather than
  // leaving a selection that matches no chip.
  const activeDuration =
    durationMin !== null && durations.includes(durationMin)
      ? durationMin
      : (durations[0] ?? 60)

  const freeStartsOn = useCallback(
    (day: string): Slot[] => {
      if (!availability) return []
      const dayWindows = availability.days.find((entry) => entry.date === day)
      if (!dayWindows) return []
      return startOptionsForDuration(
        freeRangesForDay(dayWindows, availability.busy, nowMs, timeZone),
        activeDuration
      ).filter(
        // Both edges, not just the start: a slot whose start lands
        // outside the fall-back's repeated hour but whose end lands
        // inside it would pass a start-only check, then book an hour
        // longer than the duration chip says (the button would say "1h"
        // and book 2h). Drop the whole option if either edge is ambiguous.
        (slot) =>
          roundTripsCleanly(slot.startUtc, timeZone) &&
          roundTripsCleanly(slot.endUtc, timeZone)
      )
    },
    [availability, activeDuration, nowMs, timeZone]
  )

  const startOptions = useMemo(
    () => (date ? freeStartsOn(date) : []),
    [date, freeStartsOn]
  )

  const countByDay = useMemo(() => {
    const counts = new Map<string, number>()
    for (const day of availability?.days ?? []) {
      counts.set(day.date, freeStartsOn(day.date).length)
    }
    return counts
  }, [availability, freeStartsOn])

  const dayStatusByKey = useMemo(() => {
    const statuses = new Map<string, { count: number; label: string }>()
    for (const day of availability?.days ?? []) {
      const count = countByDay.get(day.date) ?? 0
      statuses.set(day.date, {
        count,
        label: dayStatusLabel(day.date, count, day, nowMs, timeZone),
      })
    }
    return statuses
  }, [availability, countByDay, nowMs, timeZone])

  const selectedSlot: Slot | null = useMemo(() => {
    if (!value) return null
    const [d, t] = value.startsAt.split("T")
    const [ed, et] = value.endsAt.split("T")
    return {
      startUtc: new Date(wallClockToUtcMs(d, t, timeZone)).toISOString(),
      endUtc: new Date(wallClockToUtcMs(ed, et, timeZone)).toISOString(),
    }
  }, [value, timeZone])

  const pickDay = (next: string) => {
    setDate(next)
    onChange(null)
  }

  const pickDuration = (next: number) => {
    setDurationMin(next)
    onChange(null)
  }

  const pickSlot = (slot: Slot) =>
    onChange({
      startsAt: toWallClock(slot.startUtc, timeZone),
      endsAt: toWallClock(slot.endUtc, timeZone),
    })

  if (!resourceId) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Pick a resource to see when it is free.
      </p>
    )
  }

  if (failed) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Availability could not be loaded. Use “Set times manually” above.
      </p>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
      <div className={cn("space-y-4", loading && "opacity-50")}>
        <div role="group" aria-label="Duration">
          <p className="mb-2 text-sm font-medium">Duration</p>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={option === activeDuration ? "default" : "outline"}
                aria-pressed={option === activeDuration}
                className="h-8"
                onClick={() => pickDuration(option)}
              >
                {durationLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        <DayStatusContext.Provider value={dayStatusByKey}>
          <DayPicker
            mode="single"
            month={toLocalDate(`${month}-01`)}
            onMonthChange={(next) => setMonth(monthOf(toKey(next)))}
            selected={date ? toLocalDate(date) : undefined}
            today={toLocalDate(today)}
            startMonth={startMonth}
            onSelect={(picked) => {
              if (!picked) return
              const key = toKey(picked)
              if ((countByDay.get(key) ?? 0) === 0) return
              pickDay(key)
            }}
            disabled={(day) => (countByDay.get(toKey(day)) ?? 0) === 0}
            showOutsideDays
            components={dayPickerComponents}
            labels={{
              labelDayButton: (labelDate, modifiers) => {
                const entry = dayStatusByKey.get(toKey(labelDate))
                let label = entry
                  ? `${LONG_DAY_LABEL.format(labelDate)}, ${entry.label}`
                  : LONG_DAY_LABEL.format(labelDate)
                if (modifiers.today) label = `Today, ${label}`
                if (modifiers.selected) label = `${label}, selected`
                return label
              },
            }}
            classNames={{
              months: "flex flex-col",
              month_caption: "flex items-center justify-center h-9 font-medium text-sm",
              nav: "flex items-center justify-between absolute w-full px-1 h-9",
              button_previous: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
              button_next: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "text-muted-foreground w-9 text-xs font-normal",
              week: "flex w-full",
              day: "h-10 w-9 p-0 text-sm",
              day_button: "h-10 w-9 rounded-md hover:bg-accent inline-flex flex-col items-center justify-center gap-0",
              today: "font-semibold text-primary",
              selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
              outside: "text-muted-foreground/50",
              disabled: "text-muted-foreground/40 pointer-events-none",
              root: "relative",
            }}
          />
        </DayStatusContext.Provider>

        {availability && date && (
          <DayTimeline
            availability={availability}
            date={date}
            selected={selectedSlot}
            timeZone={timeZone}
            nowMs={nowMs}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Times are the location’s, not yours ({timeZone}).
        </p>
      </div>

      <div className={cn("min-w-0", loading && "pointer-events-none opacity-50")}>
        <p className="text-sm font-medium">
          {date ? date : "Pick a day"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {durationLabel(activeDuration)}
        </p>

        <div
          role="group"
          aria-label={date ? `Available start times for ${date}` : "Available start times"}
          className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1"
        >
          {startOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : date
                  ? "Nothing free that day at this length."
                  : "Pick a day with free time."}
            </p>
          ) : (
            PERIODS.map((period) => {
              const slots = startOptions.filter(
                (slot) => periodOf(slot, timeZone) === period
              )
              if (slots.length === 0) return null
              return (
                <div key={period}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {period}
                  </h3>
                  <div className="mt-1.5 space-y-1.5">
                    {slots.map((slot) => (
                      <Button
                        key={slot.startUtc}
                        type="button"
                        variant={
                          selectedSlot?.startUtc === slot.startUtc ? "default" : "outline"
                        }
                        aria-pressed={selectedSlot?.startUtc === slot.startUtc}
                        className="h-9 w-full justify-center tabular-nums"
                        onClick={() => pickSlot(slot)}
                      >
                        {formatTimeOfDay(slot.startUtc, timeZone)}–
                        {formatTimeOfDay(slot.endUtc, timeZone)}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
