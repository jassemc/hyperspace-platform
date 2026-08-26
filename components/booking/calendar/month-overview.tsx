"use client"

import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import { DayPicker, type DayButtonProps } from "react-day-picker"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { cn } from "@/lib/utils"

const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/**
 * The per-day counts the cells shade themselves by. Passed through
 * context rather than closed over, so `DayButton` can be a stable
 * module-level component: a component defined inside the render is a new
 * type on every render, which remounts every cell (and throws away the
 * focus state the library keeps in one).
 */
const DayLoadContext = createContext<{ counts: Map<string, number>; busiest: number }>({
  counts: new Map(),
  busiest: 1,
})

/**
 * Mirrors the library's own DayButton (see
 * node_modules/react-day-picker/dist/esm/components/DayButton.js): `day`
 * and `modifiers` are destructured out so they never reach the DOM — a
 * blanket `{...props}` spread would forward them as
 * `day="[object Object]"` attributes — and the focused-modifier effect is
 * what moves real keyboard focus as the grid is arrowed through.
 */
function DayLoadButton({ day, modifiers, className, ...buttonProps }: DayButtonProps) {
  const { counts, busiest } = useContext(DayLoadContext)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const count = counts.get(toKey(day.date)) ?? 0
  // Four steps rather than a continuous ramp: a reader comparing two days
  // wants "busier", not a precise value.
  const step = count === 0 ? 0 : Math.ceil((count / busiest) * 3)

  return (
    <button
      ref={ref}
      {...buttonProps}
      className={cn(
        "relative flex h-12 w-12 flex-col items-center justify-center rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        step === 1 && "bg-emerald-50 dark:bg-emerald-950",
        step === 2 && "bg-emerald-100 dark:bg-emerald-900",
        step === 3 && "bg-emerald-200 dark:bg-emerald-800",
        className
      )}
    >
      <span>{day.date.getDate()}</span>
      {count > 0 && (
        <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  )
}

const dayPickerComponents = { DayButton: DayLoadButton }

/**
 * A month of hour-blocks is unreadable, so this view answers a different
 * question: which days are busy. Picking a day switches to the day grid,
 * where the actual booking happens.
 */
export function MonthOverview({
  calendar,
  month,
  onPickDay,
  onPickMonth,
}: Readonly<{
  calendar: BookingCalendarDto
  month: string
  onPickDay: (date: string) => void
  /** YYYY-MM. Wired to the same URL navigation the toolbar's arrows use. */
  onPickMonth: (month: string) => void
}>) {
  const tz = calendar.timezone

  const loadByDay = useMemo(() => {
    const counts = new Map<string, number>()
    const dayOf = (iso: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date(iso))

    for (const entry of calendar.resources) {
      for (const block of entry.blocks) {
        const key = dayOf(block.startsAt)
        // rangeFor's month span is a fixed 31 days — the API's own
        // ceiling — so a shorter month over-fetches 1-3 days into the
        // next one (April 1 + 31 = May 2). Only count days that actually
        // belong to the displayed month, or those early-next-month
        // bookings show up as extra shaded outside-day cells carrying a
        // count the fetch never captured in full for that month.
        if (!key.startsWith(month)) continue
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return counts
  }, [calendar, tz, month])

  const load = useMemo(
    () => ({ counts: loadByDay, busiest: Math.max(1, ...loadByDay.values()) }),
    [loadByDay]
  )

  // Controlled, not `defaultMonth`. With no `month` prop the picker keeps
  // its own state (useCalendar.js:28-30), so it would ignore every later
  // `month` and drift out of step with the data fetched for the URL's
  // date — and its own arrows would move the grid without refetching.
  // Noon UTC keeps the 1st on the 1st for every offset from -12 to +14.
  const displayMonth = new Date(`${month}-01T12:00:00Z`)

  return (
    <div className="mx-4 rounded-md border p-4">
      <DayLoadContext.Provider value={load}>
        <DayPicker
          mode="single"
          month={displayMonth}
          onMonthChange={(next) =>
            onPickMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`)
          }
          showOutsideDays
          onSelect={(date) => date && onPickDay(toKey(date))}
          components={dayPickerComponents}
        />
      </DayLoadContext.Provider>
      <p className="pt-3 text-xs text-muted-foreground">
        Bookings per day. Pick a day to open its grid.
      </p>
    </div>
  )
}
