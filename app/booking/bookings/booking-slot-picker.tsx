"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { getResourceAvailability } from "@/lib/service"
import type { AvailabilityDto } from "@/lib/service/HsService"
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

/** A UTC instant as "YYYY-MM-DDTHH:mm" in `timeZone`. */
function toWallClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T")
}

const monthOf = (date: string) => date.slice(0, 7)

/** "YYYY-MM" as its first instant, and the first instant of the month after. */
function monthRange(month: string, timeZone: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number)
  const first = `${month}-01`
  const nextMonth = new Date(Date.UTC(year, m, 1))
  const next = `${nextMonth.getUTCFullYear()}-${String(
    nextMonth.getUTCMonth() + 1
  ).padStart(2, "0")}-01`
  return {
    from: new Date(wallClockToUtcMs(first, "00:00", timeZone)).toISOString(),
    to: new Date(wallClockToUtcMs(next, "00:00", timeZone)).toISOString(),
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

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

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
            key={b.start}
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
        setAvailability(data as AvailabilityDto)
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
        Availability could not be loaded. Use “Set times manually” below.
      </p>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
      <div className={cn("space-y-4", loading && "opacity-50")}>
        <div>
          <p className="mb-2 text-sm font-medium">Duration</p>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={option === activeDuration ? "default" : "outline"}
                className="h-8"
                onClick={() => pickDuration(option)}
              >
                {durationLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        <DayPicker
          mode="single"
          month={new Date(`${month}-01T12:00:00Z`)}
          onMonthChange={(next) =>
            setMonth(
              `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
            )
          }
          selected={date ? new Date(`${date}T12:00:00Z`) : undefined}
          onSelect={(picked) => {
            if (!picked) return
            const key = `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, "0")}-${String(picked.getDate()).padStart(2, "0")}`
            if ((countByDay.get(key) ?? 0) === 0) return
            pickDay(key)
          }}
          disabled={(day) => {
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
            return (countByDay.get(key) ?? 0) === 0
          }}
          showOutsideDays
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
            day: "h-9 w-9 p-0 text-sm",
            day_button: "h-9 w-9 rounded-md hover:bg-accent inline-flex items-center justify-center",
            today: "font-semibold text-primary",
            selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            outside: "text-muted-foreground/50",
            disabled: "text-muted-foreground/40 pointer-events-none",
            root: "relative",
          }}
        />

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

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {date ? date : "Pick a day"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {durationLabel(activeDuration)}
        </p>

        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {period}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {slots.map((slot) => (
                      <Button
                        key={slot.startUtc}
                        type="button"
                        variant={
                          selectedSlot?.startUtc === slot.startUtc ? "default" : "outline"
                        }
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
